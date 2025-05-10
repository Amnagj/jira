import pymongo
import time
import re
import numpy as np
from sentence_transformers import SentenceTransformer

# Connexion à MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["jira"]  # Base de données
collection = db["tickets"]  # Collection des tickets

# Charger le modèle d'embedding NLP
model = SentenceTransformer("all-MiniLM-L6-v2")  # Modèle léger pour les embeddings

def store_ticket_in_mongo(ticket_data):
    """
    Stocke uniquement l'ID, le problème, la solution, les mots-clés et l'embedding dans MongoDB.
    
    Args:
        ticket_data (dict): Dictionnaire contenant les informations du ticket.
    
    Returns:
        str: ID du ticket stocké
    """
    # Extraire les données du dictionnaire
    ticket_id = ticket_data.get("ID", "")  # Générer un ID si absent
    problem = ticket_data.get("problem", "Inconnu")
    solution = ticket_data.get("solution", "Non résolu")
    keywords = ticket_data.get("keywords", "")
    ticket_priority = ticket_data.get("ticket_priority", "")
    ticket_type = ticket_data.get("ticket_type", "")
    ticket_client_project = ticket_data.get("ticket_client_project", "")

    # Vérifier si l'ID existe déjà
    existing_ticket = collection.find_one({"_id": ticket_id})
    if existing_ticket:
        print(f"⚠️ L'ID {ticket_id} existe déjà. Mise à jour...")
        collection.replace_one({"_id": ticket_id}, ticket_data)
    
    

    # Générer un embedding basé sur le problème et les mots-clés
    text_to_embed = f"Problème: {problem}\nMots-clés: {keywords}"
    embedding_vector = model.encode(text_to_embed).tolist()
    
    # Création du document minimal à stocker
    ticket_data = {
        "_id": ticket_id,
        "problem": problem,
        "solution": solution,
        "keywords": keywords,
        "embedding": embedding_vector,
        "ticket_priority": ticket_priority,
        "ticket_type": ticket_type,
        "ticket_client_project": ticket_client_project,
        "timestamp": time.time()
    }
    
    try:
        collection.insert_one(ticket_data)
        print(f"✅ Ticket {ticket_id} ajouté à MongoDB.")
        return ticket_id
    except Exception as e:
        print(f"❌ Erreur lors de l'ajout du ticket {ticket_id}: {e}")
        return None

def get_collection_stats():
    """Retourne des statistiques sur la collection de tickets."""
    try:
        count = collection.count_documents({})
        return {
            "count": count,
            "status": "active" if count > 0 else "empty"
        }
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques: {e}")
        return {"count": 0, "status": "error", "message": str(e)}

def query_raw_collection():
    """
    Affiche les 5 derniers tickets stockés dans MongoDB.
    """
    try:
        tickets = collection.find({}, {"_id": 1, "problem": 1, "solution": 1, "keywords": 1}).sort("timestamp", -1).limit(5)
        print("\n🔍 Derniers tickets stockés:")
        for ticket in tickets:
            print(f"  - ID: {ticket['_id']}, Problème: {ticket['problem']}, Solution: {ticket['solution'][:50]}...")
    except Exception as e:
        print(f"Erreur lors de la requête: {e}")