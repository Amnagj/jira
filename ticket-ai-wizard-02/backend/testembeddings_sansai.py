import os
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import time
import re
import json
import requests
import logging
from sentence_transformers import SentenceTransformer
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from pymongo import MongoClient
from pymongo.errors import OperationFailure
from nettoyage import nettoyer_texte 
from traitement_ai import extract_ticket_info

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
            "resultats": "tickets_similarite_tfidf",
            "vecteurs": "tickets_vecteurs" 
        }
    },
    "PATHS": {
        "excel_input": "C:/Users/gouja/Downloads/Ticket117.xlsx"
    },
    "SEARCH_PARAMS": {
        "max_tickets": None,
        "use_cached_vectors": True,
        "similarity_threshold": 0.00,
        "top_n_results": 5,
        "use_ai_refinement": True,  # Désactivé par défaut pour optimiser les performances
        "batch_size": 100  # Pour le traitement par lots des embeddings
    }
}


# Utilise-les explicitement pour initialiser le moteur de recherche
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
            self.fichier_excel = config["PATHS"]["excel_input"]
            
            # Connexion à MongoDB
            self.client = MongoClient(mongodb_config["uri"])
            self.db = self.client[mongodb_config["db_name"]]
            self.tickets_collection = self.db[mongodb_config["collections"]["tickets"]]
            self.resultats_collection = self.db[mongodb_config["collections"]["resultats"]]
            self.vecteurs_collection = self.db[mongodb_config["collections"]["vecteurs"]]
            
            # Initialiser le modèle d'embeddings
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            
            # Initialiser le stemmer et les stop words
            self.stemmer = PorterStemmer()
            self.stop_words = set(stopwords.words('english') + stopwords.words('french'))
            
            # Configurer les paramètres de recherche
            self.max_tickets = search_params.get("max_tickets")
            self.use_cached_vectors = search_params.get("use_cached_vectors", True)
            self.similarity_threshold = search_params.get("similarity_threshold", 0.25)
            self.top_n_results = search_params.get("top_n_results", 5)
            self.use_ai_refinement = search_params.get("use_ai_refinement", True)
            self.batch_size = search_params.get("batch_size", 100)
            
            # S'assurer que la collection des vecteurs est correctement indexée
            self._create_vector_index()
            
            logger.info(f"✅ Connexion réussie à MongoDB, base '{mongodb_config['db_name']}'")
            count = self.tickets_collection.count_documents({})
            logger.info(f"📊 Nombre de tickets résolus dans la base: {count}")
        except Exception as e:
            logger.error(f"❌ Erreur d'initialisation: {e}")
            print(f"❌ Erreur d'initialisation: {e}")
            raise

    def _create_vector_index(self):
        """
        Crée un index sur le champ embedding_vector pour accélérer les recherches de similarité
        """
        try:
            # Vérifier si l'index existe déjà
            existing_indexes = self.vecteurs_collection.list_indexes()
            has_vector_index = any('embedding_vector' in idx.get('key', {}) for idx in existing_indexes)
            
            if not has_vector_index:
                logger.info("🔧 Création d'un index pour les vecteurs d'embeddings...")
                self.vecteurs_collection.create_index([("embedding_vector", 1)])
                logger.info("✅ Index créé avec succès")
            else:
                logger.info("✅ Index d'embeddings déjà existant")
                
        except OperationFailure as e:
            logger.warning(f"⚠️ Impossible de créer l'index: {e}")
        except Exception as e:
            logger.error(f"❌ Erreur lors de la création de l'index: {e}")

    def preprocess_text(self, text):
        """
        Prétraite le texte pour la vectorisation
        """
        try:
            # Convertir en minuscules
            text = text.lower()
            
            # Supprimer les caractères spéciaux et la ponctuation
            text = re.sub(r'[^\w\s]', '', text)
            
            # Tokeniser le texte
            tokens = text.split()
            
            # Supprimer les stop words
            tokens = [token for token in tokens if token not in self.stop_words]
            
            # Stemmatisation des tokens
            tokens = [self.stemmer.stem(token) for token in tokens]
            
            # Rejoindre les tokens
            processed_text = ' '.join(tokens)
            
            return processed_text
        
        except Exception as e:
            logger.error(f"❌ Erreur de prétraitement du texte: {e}")
            return text

    def formater_requete(self, ticket_text):
        """
        Formate la requête de ticket avec extraction d'informations et prétraitement
        """
        try:
            # Nettoyer le texte
            cleaned_text = nettoyer_texte(ticket_text)

            # Prétraiter le texte pour la recherche
            processed_text = self.preprocess_text(cleaned_text)
            
            # Extraire les informations si l'IA est activée
            if self.use_ai_refinement:
                extracted_info = extract_ticket_info(processed_text)
                
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
                        "original_text": cleaned_text,
                        "processed_text": processed_text
                    }
            
            # Version simplifiée sans IA
            return {
                "problem": cleaned_text,
                "original_text": cleaned_text,
                "processed_text": processed_text
            }
        except Exception as e:
            logger.error(f"❌ Erreur formatage requête: {e}")
            # Fallback si tout échoue
            return {
                "problem": ticket_text, 
                "original_text": ticket_text,
                "processed_text": self.preprocess_text(ticket_text)
            }

    def verifier_vecteurs_cache(self):
        """
        Vérifie si des embeddings sont déjà stockés dans MongoDB
        """
        count_vecteurs = self.vecteurs_collection.count_documents({"embedding_vector": {"$exists": True}})
        count_tickets = self.tickets_collection.count_documents({})
        
        if count_vecteurs > 0:
            logger.info(f"📊 {count_vecteurs}/{count_tickets} embeddings trouvés en cache")
            if count_vecteurs < count_tickets:
                logger.warning(f"⚠️ {count_tickets - count_vecteurs} tickets n'ont pas d'embeddings")
            return count_vecteurs > 0
        return False

    def generer_embeddings_manquants(self):
        """
        Génère les embeddings pour les tickets qui n'en ont pas encore
        """
        try:
            # Récupérer les IDs des tickets qui ont déjà des embeddings
            vecteurs_ids = set(str(vec["ticket_id"]) for vec in self.vecteurs_collection.find({}, {"ticket_id": 1}))
            
            # Récupérer les tickets qui n'ont pas d'embeddings
            tickets_sans_vecteurs = []
            if self.max_tickets:
                cursor = self.tickets_collection.find({"_id": {"$nin": list(vecteurs_ids)}}).limit(self.max_tickets)
            else:
                cursor = self.tickets_collection.find({"_id": {"$nin": list(vecteurs_ids)}})
            
            tickets_sans_vecteurs = list(cursor)
            
            if not tickets_sans_vecteurs:
                logger.info("✅ Tous les tickets ont des embeddings")
                return True
                
            logger.info(f"🔍 Génération d'embeddings pour {len(tickets_sans_vecteurs)} tickets...")
            
            # Traiter par lots pour éviter une surcharge de mémoire
            for i in range(0, len(tickets_sans_vecteurs), self.batch_size):
                batch = tickets_sans_vecteurs[i:i+self.batch_size]
                embeddings_batch = []
                
                for ticket in batch:
                    problem_text = ticket.get('problem', '')
                    keywords = ticket.get('keywords', '')
                    combined_text = f"{problem_text} {keywords}"
                    embedding_vector = self.model.encode(combined_text).tolist()
                    
                    # Préparer le document à insérer
                    embeddings_batch.append({
                        'ticket_id': ticket.get('_id'),
                        'embedding_vector': embedding_vector,
                        'last_updated': time.time()
                    })
                
                # Insertion par lots
                if embeddings_batch:
                    self.vecteurs_collection.insert_many(embeddings_batch)
                
                logger.info(f"✅ Lot {i//self.batch_size + 1}/{(len(tickets_sans_vecteurs)-1)//self.batch_size + 1} traité")
            
            return True
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de la génération des embeddings: {e}")
            return False

    def rechercher_tickets_similaires(self, ticket_text):
        """
        Recherche optimisée des tickets similaires en utilisant les embeddings
        """
        try:
            start_time = time.time()
            
            # S'assurer que tous les tickets ont des embeddings
            if not self.verifier_vecteurs_cache() or not self.generer_embeddings_manquants():
                return {"status": "error", "message": "❌ Impossible de générer les embeddings"}
            
            # Formater la requête
            query_metadata = self.formater_requete(ticket_text)
            problem_text = query_metadata["problem"]
            keywords = query_metadata.get("keywords", "")
            combined_text = f"{problem_text} {keywords}"
            
            logger.info(f"🔍 Recherche avec la problématique: {problem_text[:100]}...")
            # Dans rechercher_tickets_similaires, avant de calculer l'embedding de la requête
            logger.info(f"Texte de recherche après prétraitement: {combined_text[:300]}...")
            logger.info(f"Configuration de recherche utilisée: {self.similarity_threshold}, {self.top_n_results}")
            # Calculer l'embedding de la requête
            query_embedding = self.model.encode(combined_text).tolist()
            
            # Récupérer les embeddings depuis MongoDB par lots pour comparer
            # Cette approche évite de charger tous les embeddings en mémoire d'un coup
            found_tickets = []
            
            # Nombre total de tickets à traiter
            total_tickets = self.vecteurs_collection.count_documents({})
            
            # Recherche par lots
            for skip in range(0, total_tickets, self.batch_size):
                vecteurs_batch = list(self.vecteurs_collection.find().skip(skip).limit(self.batch_size))
                
                if not vecteurs_batch:
                    break
                    
                # Extraire les embeddings et IDs du lot
                embeddings_batch = [vec.get('embedding_vector', []) for vec in vecteurs_batch]
                ticket_ids_batch = [vec.get('ticket_id', '') for vec in vecteurs_batch]
                
                # Calculer les similarités pour ce lot
                similarities_batch = cosine_similarity([query_embedding], embeddings_batch).flatten()
                
                # Ajouter les tickets similaires au-dessus du seuil
                for i, similarity in enumerate(similarities_batch):
                    if similarity >= self.similarity_threshold:
                        ticket_id = ticket_ids_batch[i]
                        # Récupérer les détails du ticket depuis la collection principale
                        ticket = self.tickets_collection.find_one({"_id": ticket_id})
                        
                        if ticket:
                            found_tickets.append({
                                "ticket_id": str(ticket.get("_id", "")),
                                "problem": ticket.get("problem", "Non spécifié"),
                                "solution": ticket.get("solution", "Non spécifié"),
                                "keywords": ticket.get("keywords", ""),
                                "similarity_score": float(similarity)
                            })
            
            # Trier par score de similarité et limiter aux top N résultats
            found_tickets.sort(key=lambda x: x["similarity_score"], reverse=True)
            found_tickets = found_tickets[:self.top_n_results]
            
            # Raffinement par IA si activé
            raffinement_details = {}
            
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
                    logger.info(f" - ID: {ticket['ticket_id']}, Score: {ticket.get('similarity_score', 0):.3f}")
                
                return {
                    "status": "success",
                    "message": f"✅ {len(found_tickets)} tickets similaires trouvés en {search_time:.4f} secondes.",
                    "tickets": found_tickets,
                    "temps_recherche": search_time,
                    "query": query_metadata["problem"]
                }
            else:
                return {
                    "status": "not_found",
                    "message": "❌ Aucun ticket suffisamment similaire trouvé.",
                    "temps_recherche": search_time
                }
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de la recherche: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"status": "error", "message": f"❌ Erreur: {str(e)}"}

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
                f"Score de similarité initial: {ticket['similarity_score']:.2%}"
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
    
    def set_excel_file_path(self, path):
        """
        Met à jour le chemin du fichier Excel à traiter
        """
        self.fichier_excel = path
        logger.info(f"📂 Mise à jour du chemin du fichier Excel: {path}")
        return self
    
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

    def traiter_fichier_excel(self):
        """
        Traite le fichier Excel configuré contenant des tickets à rechercher.
        """
        # Dans la méthode traiter_fichier_excel
        logger.info(f"Début du traitement du fichier: {self.fichier_excel}")
        logger.info(f"Configuration actuelle: {self.config}")
        # Vérifiez si le modèle d'embedding est correctement chargé
        logger.info(f"Modèle: {self.model}")
        try:
            if not pd.io.common.is_file_like(self.fichier_excel) and not pd.io.common.is_url(self.fichier_excel):
                if not os.path.exists(self.fichier_excel):
                    logger.error(f"❌ Le fichier {self.fichier_excel} n'existe pas.")
                    return []
                    
            df = pd.read_excel(self.fichier_excel)
            resultats = []
            
            logger.info(f"📑 Traitement de {len(df)} tickets depuis le fichier Excel...")
            total_search_time = 0
            
            for idx, row in df.iterrows():
                logger.info(f"🔍 Analyse du ticket #{idx+1}...")
                # Combiner toutes les colonnes non-nulles pour créer le texte du ticket
                raw_ticket_text = " ".join(str(value) for value in row.values if pd.notna(value))
                # Rechercher des tickets similaires avec embeddings
                resultat = self.rechercher_tickets_similaires(raw_ticket_text)
                resultats.append(resultat)
                if "temps_recherche" in resultat:
                    total_search_time += resultat["temps_recherche"]
                
            avg_search_time = total_search_time / len(df) if len(df) > 0 else 0
            logger.info(f"🎯 Traitement terminé. {len(resultats)} tickets analysés.")
            logger.info(f"⏱️ Temps moyen de recherche par ticket: {avg_search_time:.4f} secondes")
            
            # Calculer des statistiques
            succes = sum(1 for r in resultats if r.get("status") == "success")
            taux_succes = (succes / len(resultats)) * 100 if resultats else 0
            logger.info(f"📊 Taux de succès: {taux_succes:.1f}% ({succes}/{len(resultats)})")
            
            # Sauvegarder les résultats dans un fichier CSV
            self.sauvegarder_resultats_csv(resultats)
            
            return resultats
        except Exception as e:
            logger.error(f"❌ Erreur lors du traitement du fichier Excel: {e}")
            return []
    def sauvegarder_resultats_csv(self, resultats):
        """
        Sauvegarde les résultats de recherche dans un fichier CSV
        """
        if not resultats:
            logger.warning("⚠ Aucun résultat à sauvegarder.")
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
            logger.info(f"✅ Résultats sauvegardés dans '{output_file}'")
        else:
            logger.warning("⚠ Aucun résultat de similarité à sauvegarder.")

def main():
    try:
        recherche = RechercheTicketsEmbeddingsOptimized()
        # Vérifier et générer les embeddings si nécessaire
        if recherche.verifier_vecteurs_cache() and recherche.generer_embeddings_manquants():
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