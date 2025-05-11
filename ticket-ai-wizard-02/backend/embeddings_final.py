import os
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import time
import re
import json
import requests
import nltk
from nltk.corpus import stopwords
from pymongo import MongoClient
from backend.nettoyage import nettoyer_texte 
from backend.traitement_ai import extract_ticket_info
import logging
from sentence_transformers import SentenceTransformer
import pickle
import base64

# Configuration de la journalisation
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

LM_STUDIO_API = "http://localhost:1234/v1/chat/completions"
CONFIG = {
    "MONGODB": {
        "uri": "mongodb://localhost:27017/",
        "db_name": "jira",
        "collections": {
            "tickets": "tickets",
            "resultats": "tickets_similarite_embeddings",  # Changé pour distinguer des résultats TF-IDF
            "embeddings": "tickets"  # Collection dédiée aux embeddings
        },
        "embed_in_tickets": True
    },
    "PATHS": {
        "excel_input": "" # Ce sera remplacé dynamiquement
    },
    "SEARCH_PARAMS": {
        "max_tickets": None,
        "use_cached_embeddings": True,
        "similarity_threshold": 0.50,  # Seuil ajusté pour les embeddings
        "top_n_results": 5,
        "use_ai_refinement": False,
        "embedding_model": "all-MiniLM-L6-v2"  # Modèle d'embedding choisi
    }
}

class RechercheTicketsEmbeddingsOptimized:
    def __init__(self, config=CONFIG):
        """
        Initialise la connexion à MongoDB et prépare le modèle d'embeddings.
        """
        try:
            # Stocker les paramètres de configuration
            self.config = config
            mongodb_config = config["MONGODB"]
            search_params = config["SEARCH_PARAMS"]
            
            # Définir l'attribut fichier_excel
            self.fichier_excel = config["PATHS"]["excel_input"]
           
            # Connexion à MongoDB
            self.client = MongoClient(mongodb_config["uri"])
            self.db = self.client[mongodb_config["db_name"]]
            self.tickets_collection = self.db[mongodb_config["collections"]["tickets"]]
            self.resultats_collection = self.db[mongodb_config["collections"]["resultats"]]
            self.embeddings_collection = self.db[mongodb_config["collections"]["embeddings"]]
            self.use_ai_refinement = search_params.get("use_ai_refinement", False)
            # Dans la méthode __init__, ajouter après les lignes d'initialisation des collections:
            self.embed_in_tickets = mongodb_config.get("embed_in_tickets", False)
            # Initialiser le modèle d'embeddings
            model_name = search_params.get("embedding_model", "all-MiniLM-L6-v2")
            self.embedding_model = SentenceTransformer(model_name)
            self.embedding_matrix = None
            self.tickets_db = None
           
            # Initialiser les stop words
            try:
                self.stop_words = set(stopwords.words('english') + stopwords.words('french'))
            except LookupError:
                # Télécharger les stopwords si nécessaire
                nltk.download('stopwords')
                self.stop_words = set(stopwords.words('english') + stopwords.words('french'))
           
            # Configurer les paramètres de recherche
            self.max_tickets = search_params.get("max_tickets")
            self.use_cached_embeddings = search_params.get("use_cached_embeddings", True)
            self.similarity_threshold = search_params.get("similarity_threshold", 0.65)
            self.top_n_results = search_params.get("top_n_results", 5)
           
            print(f"✅ Connexion réussie à MongoDB, base '{mongodb_config['db_name']}'")
            count = self.tickets_collection.count_documents({})
            print(f"📊 Nombre de tickets résolus dans la base: {count}")
            print(f"🧠 Modèle d'embeddings initialisé: {model_name}")

            logger.info(f"✅ Connexion réussie à MongoDB, base '{mongodb_config['db_name']}'")
            logger.info(f"📊 Nombre de tickets résolus dans la base: {count}")
            logger.info(f"🧠 Modèle d'embeddings initialisé: {model_name}")
           
        except Exception as e:
            logger.error(f"❌ Erreur d'initialisation: {e}")
            print(f"❌ Erreur d'initialisation: {e}")
            raise

    # Remplacer dans la méthode formater_requete
    def formater_requete(self, ticket_text):
        """
        Formate la requête de ticket avec extraction d'informations en JSON
        """
        try:
            # Si le ticket est déjà au format JSON, essayer de le parser
            try:
                ticket_data = json.loads(ticket_text)
                # Le ticket est déjà au format JSON
            except json.JSONDecodeError:
                # Le ticket n'est pas au format JSON, le nettoyer et le convertir
                cleaned_text = nettoyer_texte(ticket_text)
                # Convertir en un dictionnaire simple
                ticket_data = {"texte": cleaned_text}
                ticket_text = json.dumps(ticket_data, ensure_ascii=False)
            
            # Extraire les informations avec l'IA
            extracted_info = extract_ticket_info(ticket_text)
            
            if extracted_info:
                lines = extracted_info.split("\n")
                problem, keywords = "Inconnu", ""
                for i, line in enumerate(lines):
                    line = line.strip()
                    if line.lower().startswith("### problématique"):
                        problem = lines[i+1].strip() if i+1 < len(lines) else "Inconnu"
                    elif line.lower().startswith("### mots-clés techniques"):
                        keywords = lines[i+1].strip() if i+1 < len(lines) else ""
                
                return {
                    "problem": problem,
                    "keywords": keywords,
                    "original_text": ticket_text
                }
            else:
                return {
                    "problem": ticket_text,
                    "original_text": ticket_text
                }
        except Exception as e:
            logger.error(f"❌ Erreur formatage requête: {e}")
            # Fallback si tout échoue
            return {
                "problem": ticket_text,
                "original_text": ticket_text
            }
        
    def refine_similarity_with_ai(self, base_ticket, similar_tickets):
        """
        Utilise l'API LM Studio pour affiner la similarité des tickets avec analyse IA
        """
        try:
            if not similar_tickets:
                return []

            # Formater les tickets similaires pour le prompt
            tickets_text = "\n\n".join([
                f"Ticket ID: {ticket['ticket_id']}\n"
                f"Problème: {ticket['problem']}\n"
                f"Solution: {ticket['solution']}\n"
                f"Score de similarité initial: {ticket['similarity_score']:.2f}%"
                for ticket in similar_tickets
            ])

            prompt = f"""
            Tâche: Analyser la similarité sémantique entre un ticket de base et des tickets similaires.

            Instructions:
            1. Comparez chaque ticket avec le ticket de base
            2. Évaluez la similarité sémantique (0-100%)
            3. Identifiez les aspects techniques correspondants
            4. Fournissez une brève explication de pertinence

            Ticket de base:
            {base_ticket}

            Tickets similaires:
            {tickets_text}

            FORMAT DE RÉPONSE STRICTEMENT JSON:
            [
                {{
                    "ticket_id": "ID du ticket",
                    "similarite_semantique": 75,
                    "aspects_correspondants": ["aspect1", "aspect2"],
                    "explication_pertinence": "Explication concise"
                }}
            ]
            """

            payload = {
                "model": "mistral-nemo-instruct-2407",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1000
            }

            logger.info("📤 Envoi de la requête à l'API IA...")
            response = requests.post(LM_STUDIO_API, json=payload, timeout=180)
            response.raise_for_status()
            
            result = response.json()
            full_response = result["choices"][0]["message"]["content"]
            
            logger.info("🔍 Réponse complète de l'IA reçue")

            # Tentatives multiples de parsing JSON
            try:
                # Méthode 1 : Parsing JSON direct
                refined_tickets = json.loads(full_response)
                logger.info("✅ Parsing JSON direct réussi")
                return refined_tickets
            except json.JSONDecodeError:
                # Méthode 2 : Extraction JSON entre ```json et ```
                json_match = re.search(r'```json(.*?)```', full_response, re.DOTALL)
                if json_match:
                    try:
                        refined_tickets = json.loads(json_match.group(1))
                        logger.info("✅ Parsing JSON entre ``` réussi")
                        return refined_tickets
                    except json.JSONDecodeError:
                        logger.warning("❌ Parsing JSON entre ``` échoué")

                # Méthode 3 : Extraction JSON personnalisée
                logger.warning("⚠️ Tentative d'extraction JSON personnalisée")
                return self._parse_ai_response(full_response)

        except Exception as e:
            logger.error(f"❌ Erreur de raffinement par IA: {e}")
            return []

    def _parse_ai_response(self, ai_response):
        """
        Méthode de repli pour parser la réponse de l'IA
        """
        try:
            # Ajout de regex plus robuste
            refined_tickets = []
            pattern = re.compile(
                r'"ticket_id"\s*:\s*"?(\S+)"?.*'
                r'"similarite_semantique"\s*:\s*(\d+).*'
                r'"aspects_correspondants"\s*:\s*\[(.*?)\].*'
                r'"explication_pertinence"\s*:\s*"(.*?)"',
                re.DOTALL | re.IGNORECASE
            )

            matches = list(pattern.finditer(ai_response))
            
            for match in matches:
                ticket_id = match.group(1).strip('"')
                similarite = int(match.group(2))
                aspects = [aspect.strip().strip('"') for aspect in match.group(3).split(',') if aspect.strip()]
                explication = match.group(4).strip()

                refined_tickets.append({
                    "ticket_id": ticket_id,
                    "similarite_semantique": similarite,
                    "aspects_correspondants": aspects,
                    "explication_pertinence": explication
                })

            logger.info(f"✅ Extraction manuelle : {len(refined_tickets)} tickets raffinés")
            return refined_tickets

        except Exception as e:
            logger.error(f"❌ Échec de l'extraction manuelle : {e}")
            return []

    def encoder_embedding_pour_mongodb(self, embedding_array):
        """
        Encode un embedding numpy pour le stockage dans MongoDB
        """
        # Convertir l'array numpy en bytes via pickle
        pickled = pickle.dumps(embedding_array)
        # Encoder en base64 pour le stockage sous forme de chaîne
        return base64.b64encode(pickled).decode('utf-8')
        
    def decoder_embedding_depuis_mongodb(self, encoded_embedding):
        """
        Décode un embedding stocké dans MongoDB en array numpy avec gestion des erreurs
        """
        try:
            # Si c'est déjà une liste (probablement une liste numpy déjà stockée)
            if isinstance(encoded_embedding, list):
                return np.array(encoded_embedding, dtype=np.float32)
            
            # Sinon, assume que c'est une chaîne encodée en base64
            pickled = base64.b64decode(encoded_embedding)
            # Reconstruire l'array numpy
            return pickle.loads(pickled)
        except Exception as e:
            logger.error(f"Erreur de décodage d'embedding: {e}")
            # En cas d'erreur, retourner un embedding vide de bonne dimension
            # (vous pourriez ajuster cette dimension à celle utilisée par votre modèle)
            return np.zeros(384, dtype=np.float32)
    def verifier_format_embedding(self, embedding):
        """
        Vérifie le format d'un embedding et le convertit en numpy array si nécessaire
        """
        if embedding is None:
            return None
            
        if isinstance(embedding, list):
            return np.array(embedding, dtype=np.float32)
        elif isinstance(embedding, str):
            try:
                return self.decoder_embedding_depuis_mongodb(embedding)
            except Exception as e:
                logger.error(f"Erreur de conversion d'embedding: {e}")
                return None
        elif isinstance(embedding, np.ndarray):
            return embedding
        else:
            logger.error(f"Format d'embedding non reconnu: {type(embedding)}")
            return None
    


    def verifier_embeddings_cache(self):
        """
        Vérifie si des embeddings sont déjà stockés dans MongoDB
        """
        if self.embed_in_tickets:
            # Si les embeddings sont dans la collection tickets
            count = self.tickets_collection.count_documents({"embedding": {"$exists": True}})
        else:
            # Si les embeddings sont dans une collection séparée
            count = self.embeddings_collection.count_documents({})
        
        tickets_count = self.tickets_collection.count_documents({})
        
        # Vérifie si le nombre d'embeddings correspond au nombre de tickets
        if count > 0 and count >= tickets_count:
            print(f"✅ Utilisation de {count} embeddings en cache")
            return True
        
        print(f"⚠ Cache d'embeddings incomplet ({count}/{tickets_count})")
        return False
    def charger_tickets_depuis_mongo(self):
        """
        Charge les tickets depuis MongoDB et construit la matrice d'embeddings
        """
        try:
            start_time = time.time()
            print("📝 Chargement des tickets depuis MongoDB...")
            
            # Charger tous les tickets
            query = {}
            if self.max_tickets:
                cursor = self.tickets_collection.find(query).limit(self.max_tickets)
            else:
                cursor = self.tickets_collection.find(query)
            
            self.tickets_db = list(cursor)
            if not self.tickets_db:
                print("⚠ Aucun ticket trouvé dans la base")
                return False
                
            print(f"✅ {len(self.tickets_db)} tickets chargés")
            
            # Vérifier si on peut utiliser des embeddings en cache
            if self.use_cached_embeddings and self.verifier_embeddings_cache():
                # Créer un dictionnaire pour mapping ticket_id -> embedding
                cached_embeddings = {}
                
                if self.embed_in_tickets:
                    # Si les embeddings sont stockés directement dans la collection tickets
                    for ticket in self.tickets_db:
                        if 'embedding' in ticket:
                            ticket_id = str(ticket.get('_id'))
                            try:
                                # Utiliser la nouvelle méthode qui gère les différents formats
                                embedding = self.verifier_format_embedding(ticket['embedding'])
                                if embedding is not None:
                                    cached_embeddings[ticket_id] = embedding
                            except Exception as e:
                                logger.error(f"Erreur lors du traitement de l'embedding pour le ticket {ticket_id}: {e}")
                else:
                    # Si les embeddings sont dans une collection séparée
                    cursor = self.embeddings_collection.find({})
                    for doc in cursor:
                        if 'ticket_id' in doc and 'embedding_data' in doc:
                            try:
                                embedding = self.verifier_format_embedding(doc['embedding_data'])
                                if embedding is not None:
                                    cached_embeddings[str(doc['ticket_id'])] = embedding
                            except Exception as e:
                                logger.error(f"Erreur lors du traitement de l'embedding séparé: {e}")   
                # Vérifier que nous avons des embeddings pour tous les tickets
                embeddings_list = []
                missing_tickets = []
                
                for ticket in self.tickets_db:
                    ticket_id = str(ticket.get('_id'))
                    if ticket_id in cached_embeddings:
                        embeddings_list.append(cached_embeddings[ticket_id])
                    else:
                        missing_tickets.append(ticket)
                
                # S'il manque des embeddings, les générer
                if missing_tickets:
                    print(f"⚠ Génération d'embeddings pour {len(missing_tickets)} tickets manquants...")
                    missing_embeddings = self._generate_embeddings([
                        f"{ticket.get('problem', '')} {ticket.get('keywords', '')}"
                        for ticket in missing_tickets
                    ])
                    
                    # Ajouter les nouveaux embeddings à la liste et les sauvegarder
                    for i, ticket in enumerate(missing_tickets):
                        ticket_id = str(ticket.get('_id'))
                        embeddings_list.append(missing_embeddings[i])
                        encoded_emb = self.encoder_embedding_pour_mongodb(missing_embeddings[i])
                        
                        if self.embed_in_tickets:
                            # Stockage directement dans la collection tickets
                            self.tickets_collection.update_one(
                                {'_id': ticket.get('_id')},
                                {'$set': {
                                    'embedding': encoded_emb,
                                    'embedding_size': len(missing_embeddings[i]),
                                    'embedding_updated': time.time()
                                }},
                                upsert=False
                            )
                        else:
                            # Stockage dans la collection embeddings séparée
                            self.embeddings_collection.update_one(
                                {'ticket_id': ticket.get('_id')},
                                {'$set': {
                                    'ticket_id': ticket.get('_id'),
                                    'embedding_data': encoded_emb,
                                    'embedding_size': len(missing_embeddings[i]),
                                    'last_updated': time.time()
                                }},
                                upsert=True
                            )
                
                # Assembler la matrice finale
                if embeddings_list:
                    self.embedding_matrix = np.vstack(embeddings_list)
                    load_time = time.time() - start_time
                    print(f"⏱ Temps de chargement des embeddings: {load_time:.2f} secondes")
                    return True
                else:
                    print("⚠ Aucun embedding trouvé ou chargé")
                    return False
                    
            else:
                # Générer tous les embeddings à nouveau
                print("🧠 Génération de nouveaux embeddings pour tous les tickets...")
                texts_to_embed = [
                    f"{ticket.get('problem', '')} {ticket.get('keywords', '')}"
                    for ticket in self.tickets_db
                ]
                
                self.embedding_matrix = self._generate_embeddings(texts_to_embed)
                
                # Sauvegarder les embeddings si nécessaire
                if self.use_cached_embeddings:
                    print("💾 Sauvegarde des embeddings dans MongoDB...")
                    
                    # Sauvegarder les nouveaux embeddings
                    for i, ticket in enumerate(self.tickets_db):
                        encoded_emb = self.encoder_embedding_pour_mongodb(self.embedding_matrix[i])
                        
                        if self.embed_in_tickets:
                            # Mise à jour dans la collection tickets
                            self.tickets_collection.update_one(
                                {'_id': ticket.get('_id')},
                                {'$set': {
                                    'embedding': encoded_emb,
                                    'embedding_size': len(self.embedding_matrix[i]),
                                    'embedding_updated': time.time()
                                }},
                                upsert=False
                            )
                        else:
                            # Si utilisant une collection séparée, supprimer les anciens embeddings
                            self.embeddings_collection.delete_one({'ticket_id': ticket.get('_id')})
                            # Insertion dans la collection embeddings séparée
                            self.embeddings_collection.insert_one({
                                'ticket_id': ticket.get('_id'),
                                'embedding_data': encoded_emb,
                                'embedding_size': len(self.embedding_matrix[i]),
                                'last_updated': time.time()
                            })
                    
                gen_time = time.time() - start_time
                print(f"⏱ Temps de génération des embeddings: {gen_time:.2f} secondes")
                return True
                
        except Exception as e:
            print(f"❌ Erreur lors du chargement des tickets: {e}")
            logger.error(f"❌ Erreur lors du chargement des tickets: {e}")
            import traceback
            print(traceback.format_exc())
            return False  
        

    def _generate_embeddings(self, texts):
        """
        Génère des embeddings pour une liste de textes
        """
        # Traiter par lots pour éviter les problèmes de mémoire
        batch_size = 32
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            batch_embeddings = self.embedding_model.encode(batch_texts)
            all_embeddings.append(batch_embeddings)
            print(f"  - Traitement des embeddings: {min(i+batch_size, len(texts))}/{len(texts)}")
        
        # Concaténer tous les embeddings
        if len(all_embeddings) == 1:
            return all_embeddings[0]
        else:
            return np.vstack(all_embeddings)

    def rechercher_tickets_similaires(self, ticket_text , additional_fields=None):
        """
        Recherche les tickets similaires en utilisant les embeddings
        """
        try:
            start_time = time.time()
            
            # S'assurer que les embeddings sont chargés
            if self.embedding_matrix is None:
                success = self.charger_tickets_depuis_mongo()
                if not success:
                    return {"status": "error", "message": "❌ Impossible de charger les tickets ou embeddings"}
            
            # Formater la requête
            query_metadata = self.formater_requete(ticket_text)
            query_text = f"{query_metadata['problem']} {query_metadata.get('keywords', '')}"
            logger.info(f"🔍 Recherche avec la problématique: {query_metadata['problem'][:100]}...")
            
            # Générer l'embedding pour la requête
            query_embedding = self.embedding_model.encode([query_text])[0].reshape(1, -1)
            
            # Vérifier les dimensions
            if query_embedding.shape[1] != self.embedding_matrix.shape[1]:
                logger.error(f"❌ Incompatibilité des dimensions: requête {query_embedding.shape} vs tickets {self.embedding_matrix.shape}")
                return {"status": "error", "message": "❌ Incompatibilité des dimensions des embeddings"}
            
            # Calculer les similarités
            similarities = cosine_similarity(query_embedding, self.embedding_matrix).flatten()
            
            # Vérifier et corriger les valeurs aberrantes
            similarities = np.clip(similarities, 0, 1)  # Limiter entre 0 et 1
            
            found_tickets = []
            for i, similarity in enumerate(similarities):
                if similarity >= self.similarity_threshold:
                    ticket = self.tickets_db[i]
                    found_tickets.append({
                        "ticket_id": str(ticket.get("_id", ticket.get("ID", ""))),
                        "problem": ticket.get("problem", "Non spécifié"),
                        "solution": ticket.get("solution", "Non spécifié"),
                        "keywords": ticket.get("keywords", ""),
                        "similarity_score": float(similarity * 100)  # Convertir en pourcentage
                    })
            
            found_tickets.sort(key=lambda x: x["similarity_score"], reverse=True)
            found_tickets = found_tickets[:self.top_n_results]
            
            # Reste de la fonction identique...
            # Raffinement par IA si activé
            raffinement_details = {}
            if self.use_ai_refinement and found_tickets:
                logger.info("🤖 Raffinement des résultats par IA...")
                refined_tickets = self.refine_similarity_with_ai(query_metadata["original_text"], found_tickets)
                # Préparer les informations de raffinement pour MongoDB
                if refined_tickets:
                    for ticket in found_tickets:
                        refined_info = next((rt for rt in refined_tickets if rt["ticket_id"] == ticket["ticket_id"]), None)
                        if refined_info:
                            raffinement_details[ticket["ticket_id"]] = {
                                "semantic_similarity": refined_info.get("similarite_semantique"),
                                "corresponding_aspects": refined_info.get("aspects_correspondants"),
                                "relevance_explanation": refined_info.get("explication_pertinence")
                            }
            
            search_time = time.time() - start_time
            logger.info(f"⏱ Temps de recherche: {search_time:.4f} secondes")
            
            if found_tickets:
                # Stocker tous les détails dans un seul document MongoDB
                resultats_document = {
                    "timestamp": time.time(),
                    "nouveau_probleme": query_metadata["problem"],
                    "resultats": found_tickets,
                    "raffinement_ia": raffinement_details if self.use_ai_refinement else None,
                    "temps_recherche": search_time
                }

                self.resultats_collection.insert_one(resultats_document)
                
                logger.info(f"✅ {len(found_tickets)} tickets similaires trouvés")
                for ticket in found_tickets[:3]:
                    logger.info(f" - ID: {ticket['ticket_id']}, Score: {ticket.get('similarity_score', 'N/A'):.2f}%")
                
                result = {
                "status": "success",
                "message": f"✅ {len(found_tickets)} tickets similaires trouvés en {search_time:.4f} secondes.",
                "tickets": found_tickets,
                "temps_recherche": search_time,
                "query": query_metadata["problem"],
                "additional_fields" : additional_fields
                }

                return result

            else:
                return {
                    "status": "not_found",
                    "message": "❌ Aucun ticket suffisamment similaire trouvé.",
                    "temps_recherche": search_time,
                    "additional_fields": additional_fields
                }
        except Exception as e:
            logger.error(f"❌ Erreur lors de la recherche: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"status": "error", "message": f"❌ Erreur: {str(e)}"}
    def traiter_fichier_excel(self):
        """
        Traite le fichier Excel configuré contenant des tickets à rechercher.
        Version utilisant les embeddings.
        """
        try:
            if not os.path.exists(self.fichier_excel):
                print(f"❌ Le fichier {self.fichier_excel} n'existe pas.")
                return []
               
            df = pd.read_excel(self.fichier_excel)
            resultats = []
           
            # S'assurer que les tickets sont chargés et les embeddings générés
            if self.embedding_matrix is None:
                success = self.charger_tickets_depuis_mongo()
                if not success:
                    return []
           
            print(f"📑 Traitement de {len(df)} tickets depuis le fichier Excel...")
           
            total_search_time = 0
            for idx, row in df.iterrows():
                print(f"\n🔍 Analyse du ticket #{idx+1}...")
                # Combiner toutes les colonnes non-nulles pour créer le texte du ticket
                raw_ticket_text = " ".join(str(value) for value in row.values if pd.notna(value))
                additional_fields = {}
                if 'key' in row:
                    additional_fields['key'] = row['key'] if pd.notna(row['key']) else None
                if 'type' in row:
                    additional_fields['type'] = row['type'] if pd.notna(row['type']) else None
                if 'priority' in row:
                    additional_fields['priority'] = row['priority'] if pd.notna(row['priority']) else None
                if 'client_project' in row:
                    additional_fields['client_project'] = row['client_project'] if pd.notna(row['client_project']) else None
            

                resultat = self.rechercher_tickets_similaires(raw_ticket_text,  additional_fields)
                resultats.append(resultat)
               
                if "temps_recherche" in resultat:
                    total_search_time += resultat["temps_recherche"]
           
            avg_search_time = total_search_time / len(df) if len(df) > 0 else 0
            print(f"\n🎯 Traitement terminé. {len(resultats)} tickets analysés.")
            print(f"⏱️ Temps moyen de recherche par ticket: {avg_search_time:.4f} secondes")
           
            # Calculer des statistiques
            succes = sum(1 for r in resultats if r.get("status") == "success")
            taux_succes = (succes / len(resultats)) * 100 if resultats else 0
            print(f"📊 Taux de succès: {taux_succes:.1f}% ({succes}/{len(resultats)})")
           


           
            return resultats
        except Exception as e:
            print(f"❌ Erreur lors du traitement du fichier Excel: {e}")
            return []
   
    def sauvegarder_resultats_csv(self, resultats):
        """
        Sauvegarde les résultats de recherche dans un fichier CSV
        """
        if not resultats:
            print("⚠ Aucun résultat à sauvegarder.")
            return
           
        resultats_simples = []
        for r in resultats:
            if r.get("status") == "success" and "tickets" in r:
                for ticket in r["tickets"]:
                    resultats_simples.append({
                        "probleme_original": r.get("query", ""),
                        "ticket_similaire_id": ticket["ticket_id"],
                        "probleme_similaire": ticket["problem"],
                        "solution_proposee": ticket["solution"],
                        "score_similarite": ticket["similarity_score"],
                        "temps_recherche": r.get("temps_recherche", 0)
                    })
       
        if resultats_simples:
            df_resultats = pd.DataFrame(resultats_simples)
            output_file = "resultats_recherche_embeddings.csv"
            df_resultats.to_csv(output_file, index=False)
            print(f"✅ Résultats sauvegardés dans '{output_file}'")
        else:
            print("⚠ Aucun résultat de similarité à sauvegarder.")

def main():
    try:
        recherche = RechercheTicketsEmbeddingsOptimized()
        # Vérifier et générer les embeddings si nécessaire
        if recherche.verifier_embeddings_cache() and recherche.charger_tickets_depuis_mongo():
            print(f"\n📑 Configuration prête pour traiter des fichiers")
        else:
            print("⚠ Vérifiez que la base contient des tickets avant d'effectuer des recherches.")
        return recherche
    except Exception as e:
        print(f"❌ Erreur principale: {e}")
        import traceback
        print(traceback.format_exc())
        return None
if __name__ == "__main__":
    main()