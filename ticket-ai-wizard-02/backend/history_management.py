"""
Module de gestion de l'historique des recherches pour l'application Ticket AI Wizard.
Permet de stocker, récupérer et gérer l'historique des recherches des utilisateurs.
"""
import os
from pymongo import MongoClient
import logging
import datetime
import uuid
from bson.objectid import ObjectId
import json
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "Access"
COLLECTION_NAME = "Historique_Messages"
def connect_to_mongodb():
    """Établit une connexion à la base de données MongoDB pour l'historique."""
    try:
        # Afficher l'URI pour déboguer
        logger.info(f"Tentative de connexion à MongoDB avec URI: {MONGO_URI}")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Tester la connexion
        client.server_info()
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        # Vérifier que la collection existe ou la créer
        if COLLECTION_NAME not in db.list_collection_names():
            db.create_collection(COLLECTION_NAME)
            logger.info(f"Collection {COLLECTION_NAME} créée")




        # Vérifier que l'on peut accéder à la collection
        test_count = collection.count_documents({})
        logger.info(f"Connexion à MongoDB (historique) établie avec succès. {test_count} documents existants.")
        return client, collection
    except Exception as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        # Ne pas lever d'exception, mais retourner None
        return None, None
def add_history_item(user_id, query_text, result, ticket_ids=None, similarity_score=None, search_time=None):
    try:
        client, collection = connect_to_mongodb()
        db = client["jira"]
        history_collection = db["Historique_Messages"]
        # Vérifier si la connexion a réussi
        if client is None or collection is None:
            logger.error("Échec de connexion à MongoDB dans add_history_item")
            return {
                "status": "error",
                "message": "Échec de la connexion à MongoDB"
            }
       
        # S'assurer que user_id est une chaîne
        user_id = str(user_id)
       
        logger.info(f"Ajout à l'historique pour l'utilisateur {user_id}, query: {query_text[:50]}...")
       
        # Convertir les ObjectId en str pour tous les ticket_ids s'ils existent
        if ticket_ids:
            # Vérifier si c'est une liste de ObjectId et convertir si nécessaire
            processed_ticket_ids = []
            for tid in ticket_ids:
                if isinstance(tid, ObjectId):
                    processed_ticket_ids.append(str(tid))
                else:
                    processed_ticket_ids.append(tid)
            ticket_ids = processed_ticket_ids
       
        # S'assurer que le résultat est correctement sérialisable
        if isinstance(result, dict) and "_id" in result and isinstance(result["_id"], ObjectId):
            result["_id"] = str(result["_id"])
       
        # Créer l'élément d'historique avec les nouveaux champs
        history_item = {
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "queryText": query_text,
            "result": result if isinstance(result, str) else str(result),
            "ticketIds": ticket_ids if ticket_ids else [],
            "timestamp": int(datetime.datetime.now().timestamp() * 1000),
            "visible": True,
            "similarity_score": similarity_score,  # Nouveau champ pour le taux de similarité
            "search_time": search_time  # Nouveau champ pour le temps de recherche
        }
       
        three_mins_ago = int((datetime.datetime.now() - datetime.timedelta(minutes=3)).timestamp() * 1000)
        existing = collection.find_one({
            "userId": user_id,
            "queryText": query_text,
            "timestamp": {"$gt": three_mins_ago}
        })
       
        if existing:
            logger.info(f"Requête similaire trouvée dans les 3 dernières minutes. Pas d'ajout à l'historique.")
            existing["_id"] = str(existing["_id"]) # Convertir ObjectId en str pour la réponse
            return {
                "status": "success",
                "message": "Requête déjà présente dans l'historique récent",
                "item": existing
            }
       
        # Insérer dans la collection
        logger.info(f"Tentative d'insertion dans la collection {COLLECTION_NAME}")
        insert_result = collection.insert_one(history_item)
        logger.info(f"Résultat de l'insertion: ID={insert_result.inserted_id}")
       
        # S'assurer que l'ID est convertie en string pour la réponse JSON
        history_item["_id"] = str(insert_result.inserted_id)
        return {
            "status": "success",
            "message": "Recherche ajoutée à l'historique",
            "item": history_item
        }
    except Exception as e:
        logger.error(f"Exception dans add_history_item: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de l'ajout à l'historique: {str(e)}"
        }
    finally:
        if client is not None:
            client.close()
def get_user_history(user_id):
    """
    Récupère l'historique des recherches d'un utilisateur (seulement les éléments visibles).
    Args:
        user_id (str): Identifiant de l'utilisateur
    Returns:
        dict: Historique des recherches de l'utilisateur
    """
    client = None
    try:
        client, collection = connect_to_mongodb()
        if collection is None:
            return {
                "status": "error",
                "message": "Échec de la connexion à MongoDB"
            }
       
        user_id = str(user_id)
        logger.info(f"Recherche de l'historique pour l'utilisateur {user_id}")
       
        cursor = collection.find(
            {"userId": user_id, "visible": True}
        ).sort("timestamp", -1)
       
        history_items = list(cursor)
        for item in history_items:
            if "_id" in item:
                item["_id"] = str(item["_id"])  # Convert ObjectId to string
       
        logger.info(f"Historique récupéré pour l'utilisateur {user_id}: {len(history_items)} éléments")
        return {
            "status": "success",
            "history": history_items
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'historique: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération de l'historique: {str(e)}"
        }
    finally:
        if client is not None:
            client.close()
def hide_history_item(item_id):
    """
    Masque un élément d'historique (le rend invisible pour l'utilisateur).
   
    Args:
        item_id (str): Identifiant de l'élément à masquer
       
    Returns:
        dict: Résultat de l'opération
    """
    try:
        client, collection = connect_to_mongodb()
       
        # Mettre à jour l'élément pour le rendre invisible
        result = collection.update_one(
            {"id": item_id},
            {"$set": {"visible": False}}
        )
       
        client.close()
       
        if result.modified_count > 0:
            logger.info(f"Élément d'historique {item_id} masqué avec succès")
            return {
                "status": "success",
                "message": "Élément masqué avec succès"
            }
        else:
            logger.warning(f"Élément d'historique {item_id} non trouvé ou déjà masqué")
            return {
                "status": "warning",
                "message": "Élément non trouvé ou déjà masqué"
            }
    except Exception as e:
        logger.error(f"Erreur lors du masquage de l'élément: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors du masquage de l'élément: {str(e)}"
        }
def clear_user_history(user_id):
    """
    Masque tous les éléments d'historique d'un utilisateur.
   
    Args:
        user_id (str): Identifiant de l'utilisateur
       
    Returns:
        dict: Résultat de l'opération
    """
    try:
        client, collection = connect_to_mongodb()
       
        # Mettre à jour tous les éléments de l'utilisateur pour les rendre invisibles
        result = collection.update_many(
            {"userId": user_id, "visible": True},
            {"$set": {"visible": False}}
        )
       
        client.close()
       
        logger.info(f"Historique effacé pour l'utilisateur {user_id}: {result.modified_count} éléments masqués")
        return {
            "status": "success",
            "message": f"{result.modified_count} éléments masqués avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors de l'effacement de l'historique: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de l'effacement de l'historique: {str(e)}"
        }
def json_compatible_result(obj):
    """Convertit tous les ObjectId en str dans un objet pour le rendre compatible JSON."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, ObjectId):
                obj[k] = str(v)
            elif isinstance(v, dict) or isinstance(v, list):
                obj[k] = json_compatible_result(v)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if isinstance(item, ObjectId):
                obj[i] = str(item)
            elif isinstance(item, dict) or isinstance(item, list):
                obj[i] = json_compatible_result(item)
    return obj


def get_history_item_details(item_id):
    """
    Récupère les détails d'un élément d'historique y compris les tickets associés.
   
    Args:
        item_id (str): Identifiant de l'élément d'historique
       
    Returns:
        dict: Résultat contenant l'élément d'historique et les tickets associés
    """
    client_access = None
    client_jira = None
   
    try:
        # Connexion à la base Access pour l'historique
        client_access, history_collection = connect_to_mongodb()
        if client_access is None or history_collection is None:
            logger.error("Échec de connexion à MongoDB dans get_history_item_details")
            return {
                "status": "error",
                "message": "Échec de la connexion à MongoDB"
            }
       
        # Récupérer l'élément d'historique par son ID
        history_item = None
       
        # Essayer d'abord avec le champ 'id'
        history_item = history_collection.find_one({"id": item_id})
       
        # Si non trouvé, essayer avec le champ '_id' au cas où un ObjectId a été fourni
        if not history_item and len(item_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in item_id):
            try:
                obj_id = ObjectId(item_id)
                history_item = history_collection.find_one({"_id": obj_id})
            except Exception as e:
                logger.warning(f"Échec de conversion en ObjectId: {e}")
       
        if not history_item:
            logger.warning(f"Élément d'historique non trouvé: {item_id}")
            return {
                "status": "error",
                "message": "Élément d'historique non trouvé"
            }
       
        # Convertir les ObjectId en str pour JSON
        history_item = json_compatible_result(history_item)
       
        # Récupérer les IDs des tickets associés
        ticket_ids = history_item.get("ticketIds", [])
        tickets = []
       
        if ticket_ids:
            logger.info(f"Recherche détaillée pour {len(ticket_ids)} tickets: {ticket_ids}")
            try:
                # Connexion à la base jira pour les tickets
                client_jira = MongoClient(MONGO_URI)
                tickets_collection = client_jira["jira"]["tickets"]
               
                for ticket_id in ticket_ids:
                    # Nouvelle stratégie - recherche multiple en une seule requête
                    query = {
                        "$or": [
                            {"_id": ticket_id},
                            {"ID": ticket_id},
                            {"key": ticket_id},
                            {"ticketIds": ticket_id}  # Au cas où il y a un champ ticketIds dans les tickets
                        ]
                    }
                   
                    # Si le format est de type palmint, ajouter une recherche regex
                    if isinstance(ticket_id, str) and 'palmint' in ticket_id.lower():
                        query["$or"].append({"_id": {"$regex": f".*{ticket_id}.*", "$options": "i"}})
                        query["$or"].append({"key": {"$regex": f".*{ticket_id}.*", "$options": "i"}})
                   
                    # Si le format pourrait être un ObjectId, essayer cette conversion
                    if isinstance(ticket_id, str) and len(ticket_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in ticket_id):
                        try:
                            obj_id = ObjectId(ticket_id)
                            query["$or"].append({"_id": obj_id})
                        except Exception as e:
                            logger.warning(f"Échec de conversion en ObjectId: {e}")
                   
                    # Exécuter la requête optimisée
                    logger.debug(f"Exécution de la requête: {query}")
                    ticket = tickets_collection.find_one(query)
                   
                    if ticket:
                        logger.info(f"Ticket trouvé: {ticket.get('_id')}")
                        ticket = json_compatible_result(ticket)
                        tickets.append({
                            "ticket_id": str(ticket.get("_id", ticket.get("ID", ticket.get("key", ticket_id)))),
                            "problem": ticket.get("problem", ""),
                            "solution": ticket.get("solution", ""),
                            "keywords": ticket.get("keywords", ""),
                            "similarity_score": ticket.get("similarity_score", 100)
                        })
                    else:
                        logger.warning(f"Ticket non trouvé avec ID: {ticket_id}")
                        # Ticket placeholder pour les tickets non trouvés
                        tickets.append({
                            "ticket_id": ticket_id,
                            "problem": "Ticket non trouvé dans la base de données",
                            "solution": "Vérifiez la correspondance des IDs entre les collections",
                            "keywords": "",
                            "similarity_score": 0
                        })
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des tickets: {e}")
            finally:
                if client_jira:
                    client_jira.close()
       
        return {
            "status": "success",
            "history_item": history_item,
            "tickets": tickets
        }
   
    except Exception as e:
        logger.error(f"Erreur dans get_history_item_details: {e}")
        return {
            "status": "error",
            "message": f"Erreur interne lors de la récupération de l'historique: {str(e)}"
        }
    finally:
        if client_access:
            client_access.close()


def debug_ticket_id(ticket_id, tickets_collection):
    """
    Fonction de débogage pour tester différentes méthodes de recherche d'ID de ticket.
    """
    debug_info = {
        "ticket_id_original": ticket_id,
        "methods_tried": [],
        "ticket_found": False
    }
   
    # Méthode 1: Recherche directe par _id (comme chaîne)
    debug_info["methods_tried"].append({"method": "direct_id", "query": {"_id": ticket_id}})
    ticket = tickets_collection.find_one({"_id": ticket_id})
    if ticket:
        debug_info["ticket_found"] = True
        debug_info["found_method"] = "direct_id"
        debug_info["ticket_sample"] = {"_id": str(ticket.get("_id")), "autres_champs": "..."}
        return debug_info
   
    # Méthode 2: Recherche spécifique pour les IDs de type "palmint"
    if isinstance(ticket_id, str) and 'palmint' in ticket_id.lower():
        debug_info["methods_tried"].append({"method": "palmint_check", "info": "ID contient 'palmint'"})
   
    # Méthode 3: Avec ObjectId si format valide
    if isinstance(ticket_id, str) and len(ticket_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in ticket_id):
        try:
            obj_id = ObjectId(ticket_id)
            debug_info["methods_tried"].append({"method": "objectid", "query": {"_id": str(obj_id)}})
            ticket = tickets_collection.find_one({"_id": obj_id})
            if ticket:
                debug_info["ticket_found"] = True
                debug_info["found_method"] = "objectid"
                debug_info["ticket_sample"] = {"_id": str(ticket.get("_id")), "autres_champs": "..."}
                return debug_info
        except Exception as e:
            debug_info["methods_tried"].append({"method": "objectid", "error": str(e)})
   
    # Méthode 4: Recherche par champ alternatif "ID"
    debug_info["methods_tried"].append({"method": "ID_field", "query": {"ID": ticket_id}})
    ticket = tickets_collection.find_one({"ID": ticket_id})
    if ticket:
        debug_info["ticket_found"] = True
        debug_info["found_method"] = "ID_field"
        debug_info["ticket_sample"] = {"_id": str(ticket.get("_id")), "ID": ticket.get("ID"), "autres_champs": "..."}
        return debug_info
   
    # Méthode 5: Recherche par champ "ticket_id"
    debug_info["methods_tried"].append({"method": "ticket_id_field", "query": {"ticket_id": ticket_id}})
    ticket = tickets_collection.find_one({"ticket_id": ticket_id})
    if ticket:
        debug_info["ticket_found"] = True
        debug_info["found_method"] = "ticket_id_field"
        debug_info["ticket_sample"] = {"_id": str(ticket.get("_id")), "ticket_id": ticket.get("ticket_id"), "autres_champs": "..."}
        return debug_info
   
    # Exploration de la structure de la collection tickets
    random_tickets = list(tickets_collection.find().limit(3))
    if random_tickets:
        sample_fields = []
        for t in random_tickets:
            sample_fields.append({k: str(v) if isinstance(v, ObjectId) else v for k, v in list(t.items())[:5]})
        debug_info["collection_sample"] = sample_fields
   
    return debug_info




