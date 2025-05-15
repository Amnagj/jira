""" 
FastAPI server file for integration with the React frontend. 
This file serves as a template for implementing the backend API. 
To run this server, install FastAPI and uvicorn: 
    pip install fastapi uvicorn python-multipart 
Then run: 
    uvicorn fastapi_server:app --reload 
""" 
import json
from queue import Full
from urllib import request
from fastapi import Body, Request 
from fastapi.security import OAuth2PasswordRequestForm , OAuth2PasswordBearer
from jose import JWTError
import jwt 
from backend.auth import ALGORITHM, SECRET_KEY, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES , get_current_user 
from datetime import timedelta 
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel, validator 
from fastapi import FastAPI, UploadFile, File, HTTPException, status , Depends
from typing import List, Optional 
import os 
import tempfile 
import shutil 
import sys 
import time 
from backend.history_management import MONGO_URI, add_history_item, get_user_history, hide_history_item, clear_user_history , connect_to_mongodb , json_compatible_result
from src.api.users_endpoints import router as users_router
from bson import ObjectId
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import pymongo
import statistics
import time
from fastapi import Depends, HTTPException, status



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False) 

async def get_current_user_optional(token: str = Depends(oauth2_scheme)): 
    if not token: 
        return None 
    try: 
        return await get_current_user(token) 
    except: 
        return None 


app = FastAPI( 
    title="Ticket AI API", 
    description="API for processing and analyzing support tickets", 
    version="1.0.0", 
) 

# Configure CORS to allow requests from the frontend 
app.add_middleware( 
    CORSMiddleware, 
    allow_origins=["*"],  # Your frontend URL 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
) 
app.include_router(users_router)




class TicketData(BaseModel): 
    ID: str 
    problem: str 
    solution: str 
    keywords: str 
    status: Optional[str] = None
    
    @validator('status') 
    def validate_status(cls, v): 
        if v and v.lower() != 'fixed': 
            raise ValueError("Seuls les tickets avec le statut 'Fixed' sont acceptés") 
        return v 

class TicketSearchRequest(BaseModel): 
    ticket_text: str 

class TicketResponse(BaseModel): 
    ticket_id: str 
    problem: str 
    solution: str 
    keywords: str 
    similarity_score: float 

class SearchResponse(BaseModel): 
    status: str 
    message: str 
    tickets: Optional[List[TicketResponse]] = None 
    temps_recherche: Optional[float] = None 
    query: Optional[str] = None 

class HistoryResponse(BaseModel): 
    status: str 
    history: Optional[List[dict]] = None 
    message: Optional[str] = None 

class DeleteHistoryRequest(BaseModel): 
    item_id: str 

class Token(BaseModel): 
    access_token: str 
    token_type: str 
    user: dict 

@app.post("/token") 
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()): 
    user = authenticate_user(form_data.username, form_data.password) 
    if not user: 
        raise HTTPException( 
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Email ou mot de passe incorrect", 
            headers={"WWW-Authenticate": "Bearer"}, 
        ) 
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) 
    access_token = create_access_token( 
        data={"sub": str(user["_id"])}, 
        expires_delta=access_token_expires 
    ) 
    return { 
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": { 
            "id": str(user["_id"]), 
            "username": user["username"], 
            "email": user["email"], 
            "isAdmin": user.get("isAdmin", False) 
        } 
    } 


@app.post("/upload-file", response_model=SearchResponse) 
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user_optional)): 
    try:
        # Créer un fichier temporaire
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            # Copier le fichier uploadé dans le fichier temporaire
            shutil.copyfileobj(file.file, tmp)
            temp_file_path = tmp.name
           
        print(f"Fichier temporaire créé: {temp_file_path}")
       
        try:
            # Vérifier que le fichier existe
            if not os.path.exists(temp_file_path):
                raise HTTPException(
                    status_code=500,
                    detail="Le fichier temporaire n'a pas été correctement créé"
                )
               
            # Essayer de lire le fichier avec pandas d'abord pour vérifier qu'il est lisible
            import pandas as pd
            try:
                df = pd.read_excel(temp_file_path)
                print(f"Fichier Excel lu avec succès, {len(df)} lignes trouvées")
            except Exception as excel_error:
                print(f"Erreur lors de la lecture du fichier Excel: {excel_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur lors de la lecture du fichier Excel: {str(excel_error)}"
                )
            try:
                from backend.embeddings_final import RechercheTicketsEmbeddingsOptimized
                print("Module embeddings_final importé avec succès")
            except ImportError as import_error:
                print(f"Erreur d'importation du module embeddings_final: {import_error}")
                # Nettoyer et renvoyer une erreur
                os.unlink(temp_file_path)
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur d'importation du module embeddings_final: {str(import_error)}"
                )
           
            # Initialiser le moteur de recherche avec le chemin du fichier
            try:
                from backend.embeddings_final import CONFIG
                custom_config = CONFIG.copy()  # Copier la configuration par défaut
                custom_config["PATHS"]["excel_input"] = temp_file_path  # Mettre à jour le chemin du fichier Excel
                recherche = RechercheTicketsEmbeddingsOptimized(config=custom_config)
                print("Instance de RechercheTicketsEmbeddingsOptimized créée")
            except Exception as instance_error:
                print(f"Erreur lors de la création de l'instance RechercheTicketsEmbeddingsOptimized: {instance_error}")
                # Nettoyer et renvoyer une erreur
                os.unlink(temp_file_path)
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur lors de l'initialisation du moteur de recherche: {str(instance_error)}"
                )


            # Lire le contenu du fichier Excel avec gestion d'erreurs
            try:
                resultats = recherche.traiter_fichier_excel()  # Utiliser la méthode qui traite le fichier
                print(f"Fichier Excel traité avec succès, {len(resultats) if resultats else 0} résultats trouvés")
            except Exception as process_error:
                print(f"Erreur lors du traitement du fichier Excel: {process_error}")
                # Nettoyer et renvoyer une erreur
                os.unlink(temp_file_path)
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur lors du traitement du fichier Excel: {str(process_error)}"
                )
            os.unlink(temp_file_path)
            print("Fichier temporaire supprimé")
           
            if current_user and resultats and len(resultats) > 0:
                try:
                    
                    # Extraire les données pertinentes
                    tickets = resultats[0].get("tickets", [])
                    temps_recherche = resultats[0].get("temps_recherche", None)
                    additional_fields = resultats[0].get("additional_fields", {})

                    # Calculer le score de similarité moyen s'il existe des tickets
                    max_similarity = None
                    if tickets:
                        similarity_scores = [ticket.get("similarity_score", 0) for ticket in tickets]
                        if similarity_scores:
                            max_similarity = max(similarity_scores)
                    
                    add_history_item(
                        user_id=current_user["id"],
                        query_text=file.filename, # Utiliser le nom du fichier comme requête
                        result=resultats[0].get("message", ""),
                        ticket_ids=[ticket["ticket_id"] for ticket in tickets] if tickets else [],
                        similarity_score=max_similarity,  # Ajouter le score de similarité moyen
                        search_time=temps_recherche,
                        key=additional_fields.get('key'),
                        type=additional_fields.get('type'), 
                        priority=additional_fields.get('priority'),
                        client_project=additional_fields.get('client_project')
                    )
                    print("Résultat ajouté à l'historique avec succès")
                except Exception as hist_error:
                    print(f"Erreur lors de l'ajout à l'historique: {hist_error}")
                return resultats[0] 
            else: 
                print("Aucun résultat trouvé") 
                return { 
                    "status": "not_found", 
                    "message": "Aucun ticket similaire trouvé" 
                } 
                
        except Exception as e: 
            print(f"Erreur générale lors du traitement: {e}") 
            if os.path.exists(temp_file_path): 
                os.unlink(temp_file_path) 
            raise HTTPException( 
                status_code=500, 
                detail=f"Erreur lors du traitement du fichier: {str(e)}" 
            ) 
            
    except Exception as e: 
        print(f"Erreur lors du téléchargement: {e}") 
        # Si le fichier temporaire existe, le nettoyer 
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            try: 
                os.unlink(temp_file_path) 
            except: 
                pass 
        raise HTTPException( 
            status_code=500, 
            detail=f"Erreur lors du téléchargement du fichier: {str(e)}" 
        ) 


@app.post("/search-history/add", response_model=dict)
async def add_search_to_history(
    data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Ajoute une recherche à l'historique de l'utilisateur
    """
    try:
        query_text = data.get("ticket_text", "")
        result = data.get("result", "") # Assurez-vous que result est une chaîne
        ticket_ids = data.get("ticketIds", []) # Récupérer directement les ticketIds
        similarity_score = data.get("similarity_score", None) # Récupérer le taux de similarité
        search_time = data.get("search_time", None) # Récupérer le temps de recherche
        key = data.get("key","") 
        type_field = data.get("type","") 
        priority = data.get("priority","") 
        client_project = data.get("client_project","")
        # Ajouter à l'historique avec les nouveaux paramètres
        history_item = add_history_item(
            user_id=current_user["id"],
            query_text=query_text,
            result=result,
            ticket_ids=ticket_ids,
            similarity_score=similarity_score,
            search_time=search_time,
            key=key,
            type=type_field,
            priority=priority,
            client_project=client_project

        )
        return history_item
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erreur lors de l'ajout à l'historique: {str(e)}"
        }


@app.get("/search-history", response_model=HistoryResponse)
async def get_search_history(current_user: dict = Depends(get_current_user)):
    """
    Récupère l'historique des recherches de l'utilisateur actuel
    """
    try:
        user_id = str(current_user["id"])
        print(f"Récupération de l'historique pour l'utilisateur {user_id}")
       
        # Utiliser la fonction pour récupérer l'historique
        history_result = get_user_history(user_id)
       
        # S'assurer que l'historique est correctement formaté
        if not isinstance(history_result, dict):
            history_result = {"status": "success", "history": []}
       
        if "history" not in history_result:
            history_result["history"] = []
           
        # Assurer que history est toujours une liste
        if history_result["history"] is None:
            history_result["history"] = []
           
        # Transformer _id MongoDB en string si nécessaire
        if history_result["history"]:
            for item in history_result["history"]:
                if "_id" in item:
                    item["id"] = str(item["_id"])
                    del item["_id"]
                   
        print(f"Historique récupéré: {len(history_result['history'])} éléments")
        return history_result
       
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Erreur lors de la récupération de l'historique: {e}")
        print(f"Trace complète: {error_trace}")
       
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération de l'historique: {str(e)}",
            "history": []  # Toujours renvoyer une liste vide en cas d'erreur
        }


@app.post("/search-history/hide", response_model=dict) 
async def hide_from_history( 
    request: DeleteHistoryRequest, 
    current_user: dict = Depends(get_current_user) 
): 
    """ 
    Masque un élément de l'historique 
    """ 
    try: 
        return hide_history_item(request.item_id) 
    except Exception as e: 
        return { 
            "status": "error", 
            "message": f"Erreur lors du masquage de l'élément: {str(e)}" 
        } 

@app.post("/search-history/clear", response_model=dict) 
async def clear_history(current_user: dict = Depends(get_current_user)): 
    """ 
    Masque tous les éléments de l'historique d'un utilisateur 
    """ 
    try: 
        return clear_user_history(current_user["id"]) 
    except Exception as e: 
        return { 
            "status": "error", 
            "message": f"Erreur lors de l'effacement de l'historique: {str(e)}" 
        } 

@app.post("/validate-excel") 
async def validate_excel(file: UploadFile = File(...)): 
    """ 
    Validate that the Excel file is in the correct format for processing. 
    """ 
    try: 
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp: 
            shutil.copyfileobj(file.file, tmp) 
            temp_file_path = tmp.name 
        
        try: 
            import pandas as pd 
            df = pd.read_excel(temp_file_path) 
            
            # Vérifier que le fichier n'est pas vide 
            if df.empty: 
                return {"isValid": False, "message": "Le fichier Excel est vide."} 
            
            # Vous pouvez ajouter d'autres validations spécifiques ici 
            # Par exemple, vérifier la présence de certaines colonnes 
            
            os.unlink(temp_file_path) 
            return {"isValid": True, "message": "Le fichier Excel est valide."} 
            
        except Exception as e: 
            os.unlink(temp_file_path) 
            return {"isValid": False, "message": f"Erreur lors de la lecture du fichier Excel: {str(e)}"} 
    except Exception as e: 
        if 'temp_file_path' in locals(): 
            try: 
                os.unlink(temp_file_path) 
            except: 
                pass 
        return {"isValid": False, "message": f"Erreur lors de la validation du fichier: {str(e)}"} 

@app.post("/messages/record")
async def record_message(message_data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    """
    Enregistre un message dans l'historique
    """
    try:
        # Récupérer les données du message
        message_data = await request.json()
        user_id = message_data.get("userId")
        message_text = message_data.get("message_text", "")
        ticket_ids = message_data.get("ticket_ids", [])
        user_id = current_user["id"]


        print(f"Enregistrement de message pour l'utilisateur {user_id}: {message_text[:50]}...")
        print(f"Tickets associés: {ticket_ids}")
       
        # Ajouter le message à l'historique en utilisant la fonction existante
        result = add_history_item(
            user_id=user_id,
            query_text=message_text,
            result=message_data.get("result", ""),
            ticket_ids=ticket_ids
        )
        if isinstance(result, dict):
            result = json_compatible_result(result)


        print(f"Résultat de l'ajout: {result}")
        return result
    except Exception as e:
        print(f"Erreur lors de l'enregistrement du message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement du message: {str(e)}"
        )




@app.post("/telecharger-excel") 
async def telecharger_excel(file: UploadFile = File(...)): 
    """ 
    Upload et traitement d'un fichier Excel contenant des tickets 
    depuis l'interface admin. Seuls les tickets avec le statut "Fixed" 
    seront traités et stockés dans MongoDB. 
    """ 
    try: 
        # Créer un fichier temporaire 
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp: 
            # Copier le fichier uploadé dans le fichier temporaire 
            shutil.copyfileobj(file.file, tmp) 
            temp_file_path = tmp.name 
            print(f"📄 Fichier temporaire créé: {temp_file_path}") 
        
        # Importer le main avec le chemin correct 
        from backend.main import main 
        
        # Appeler la fonction de traitement avec le chemin du fichier 
        stats = main(temp_file_path) 
 
        # Nettoyer le fichier temporaire 
        try: 
            os.unlink(temp_file_path) 
            print("🧹 Fichier temporaire supprimé") 
        except Exception as e: 
            print(f"⚠ Erreur lors de la suppression du fichier temporaire: {e}") 
        
        # Retourner la réponse avec les résultats 
        return { 
            "status": "success", 
            "message": f"Le fichier {file.filename} a été traité et importé avec succès", 
            "processed_tickets": stats.get("processed", 0), 
            "fixed_tickets": stats.get("fixed", 0), 
            "skipped_tickets": stats.get("skipped", 0), 
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S") 
        } 
    except Exception as e: 
        # Si le fichier temporaire a été créé, le nettoyer 
        if 'temp_file_path' in locals(): 
            try: 
                os.unlink(temp_file_path) 
            except: 
                pass 
        import traceback 
        error_details = traceback.format_exc() 
        print(f"❌ Erreur détaillée: {error_details}") 
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier: {str(e)}") 
from fastapi import Query
from pymongo import MongoClient
from typing import List
from pydantic import BaseModel

class TicketIdsRequest(BaseModel):
    ticket_ids: List[str]

@app.post("/tickets/details", response_model=dict)
async def get_tickets_details(
    ticket_ids_request: TicketIdsRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        ticket_ids = ticket_ids_request.ticket_ids
        
        if not ticket_ids:
            return {
                "status": "error",
                "message": "Aucun ID de ticket fourni"
            }
        
        MONGO_URI = "mongodb://localhost:27017"
        client = MongoClient(MONGO_URI)
        tickets_collection = client["jira"]["tickets"]
        tickets = []

        for ticket_id in ticket_ids:
            # Approche multiple pour la recherche
            query = {
                "$or": [
                    {"_id": ticket_id},
                    {"ID": ticket_id},
                    {"key": ticket_id},
                    {"ticketIds": ticket_id}
                ]
            }
            
            # Inclure recherche regex pour format palmint
            if isinstance(ticket_id, str) and 'palmint' in ticket_id.lower():
                query["$or"].append({"_id": {"$regex": f".*{ticket_id}.*", "$options": "i"}})
                query["$or"].append({"key": {"$regex": f".*{ticket_id}.*", "$options": "i"}})
            
            # Essayer ObjectId si format valide
            if isinstance(ticket_id, str) and len(ticket_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in ticket_id):
                try:
                    obj_id = ObjectId(ticket_id)
                    query["$or"].append({"_id": obj_id})
                except Exception:
                    pass
            
            # Effectuer la recherche
            ticket = tickets_collection.find_one(query)
            
            if ticket:
                # Convertir les ObjectId et autres types non sérialisables en str
                ticket = json_compatible_result(ticket)
                tickets.append({
                    "ticket_id": str(ticket.get("_id", ticket.get("ID", ticket.get("key", ticket_id)))),
                    "problem": ticket.get("problem", ""),
                    "solution": ticket.get("solution", ""),
                    "keywords": ticket.get("keywords", ""),
                    "similarity_score": ticket.get("similarity_score", 100)
                })
            else:
                tickets.append({
                    "ticket_id": ticket_id,
                    "problem": "Ticket non trouvé",
                    "solution": "",
                    "keywords": "",
                    "similarity_score": 0
                })
        
        client.close()
        return {
            "status": "success",
            "tickets": tickets
        }
    except Exception as e:
        if 'client' in locals():
            client.close()
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des tickets: {str(e)}"
        }
@app.get("/search-history/details/{history_id}", response_model=dict)
async def get_history_details(
    history_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        from backend.history_management import get_history_item_details
        
        # Récupérer les détails complets de l'élément d'historique
        details = get_history_item_details(history_id)
        
        if details.get("status") != "success":
            return {
                "status": "error",
                "message": details.get("message", "Élément d'historique non trouvé")
            }
            
        return details
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des détails de l'historique: {str(e)}"
        }
    
@app.get("/admin/stats/tickets", response_model=dict)
async def get_tickets_stats(current_user: dict = Depends(get_current_user), project: str = None):
    """Récupère les statistiques sur les tickets pour le dashboard admin."""
    # Vérifier que l'utilisateur est un admin
    if not current_user.get("isAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    try:
        # Connexion à MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        db_jira = client["jira"]
        tickets_collection = db_jira["tickets"]
       
        # Filtre de base pour les requêtes (si un projet est spécifié)
        base_filter = {"ticket_client_project": project} if project else {}
       
        # Statistiques sur les tickets
        total_tickets = tickets_collection.count_documents(base_filter)
       
        # Obtenir les 5 mots-clés les plus fréquents
        pipeline = []
        if project:
            pipeline.append({"$match": {"ticket_client_project": project}})
           
        # Correction ici: utilisation correcte de la méthode extend
        pipeline.extend([
            {"$project": {
                "keywordsList": {"$split": ["$keywords", ","]}  # Diviser par virgule
            }},
            {"$unwind": "$keywordsList"},
            {"$group": {"_id": "$keywordsList", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ])
       
        top_keywords = list(tickets_collection.aggregate(pipeline))


        # Stats par date (nombre de tickets ajoutés par jour sur les 30 derniers jours)
        thirty_days_ago = time.time() - (30 * 24 * 60 * 60)
        pipeline_dates = [
            {"$match": {"timestamp": {"$gte": thirty_days_ago}}}
        ]
       
        if project:
            pipeline_dates[0]["$match"]["ticket_client_project"] = project
           
        pipeline_dates.extend([
            {"$project": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": {"$multiply": ["$timestamp", 1000]}}}},
            }},
            {"$group": {"_id": "$date", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ])
       
        tickets_by_date = list(tickets_collection.aggregate(pipeline_dates))
       
        # Stats par projet
        pipeline_projects = [
            {"$group": {"_id": "$ticket_client_project", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
       
        tickets_by_project = list(tickets_collection.aggregate(pipeline_projects))
       
        # Liste des projets pour filtrage
        projects_list = tickets_collection.distinct("ticket_client_project")
       
        client.close()
       
        return {
            "status": "success",
            "stats": {
                "total_tickets": total_tickets,
                "top_keywords": top_keywords,
                "tickets_by_date": tickets_by_date,
                "tickets_by_project": tickets_by_project,
                "projects_list": projects_list,
                "current_project": project
            }
        }
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques des tickets: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}"
        }




@app.get("/admin/stats/searches", response_model=dict)
async def get_searches_stats(current_user: dict = Depends(get_current_user), project: str = None):
    """Récupère les statistiques sur les recherches pour le dashboard admin."""
    # Vérifier que l'utilisateur est un admin
    if not current_user.get("isAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
   
    try:
        # Connexion à MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        db_access = client["Access"]
        history_collection = db_access["Historique_Messages"]
        users_collection = db_access["Users"]

        # Base du filtre
        match_filter = {}
       
        # Ajouter un filtre par projet si spécifié
        if project:
            # Filtrer directement par le client_project dans les messages d'historique
            match_filter["client_project"] = project
       
        # Nombre total de recherches
        total_searches = history_collection.count_documents(match_filter)
       
        # Recherches par jour (30 derniers jours)
        thirty_days_ago = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
        pipeline_dates = [
            {"$match": {**match_filter, "timestamp": {"$gte": thirty_days_ago}}},
            {"$project": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$timestamp"}}},
            }},
            {"$group": {"_id": "$date", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        searches_by_date = list(history_collection.aggregate(pipeline_dates))
       
        # Temps de réponse moyen (extraction à partir des résultats)
        pipeline_response_time = [
            {"$match": {**match_filter, "search_time": {"$exists": True}}},
            {"$group": {"_id": None, "avg_time": {"$avg": "$search_time"}}}
        ]
        response_time_result = list(history_collection.aggregate(pipeline_response_time))
        avg_response_time = response_time_result[0]["avg_time"] if response_time_result else None
       
        # Taux de similarité moyen
        pipeline_similarity = [
            {"$match": {**match_filter, "similarity_score": {"$exists": True}}},
            {"$group": {"_id": None, "avg_similarity": {"$avg": "$similarity_score"}}}
        ]
        similarity_result = list(history_collection.aggregate(pipeline_similarity))
        avg_similarity = similarity_result[0]["avg_similarity"] if similarity_result else None
       
        # Distribution des scores de similarité
        pipeline_similarity_distribution = [
            {"$match": {**match_filter, "similarity_score": {"$exists": True}}},
            {"$bucket": {
                "groupBy": "$similarity_score",
                "boundaries": [50, 60, 70, 80, 90, 100],
                "default": "Other",
                "output": {
                    "count": {"$sum": 1}
                }
            }}
        ]
        similarity_distribution = list(history_collection.aggregate(pipeline_similarity_distribution))
       
        # Top 5 des utilisateurs par nombre de recherches
        pipeline_users = [
            {"$match": match_filter},
            {"$group": {"_id": "$userId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        top_users_raw = list(history_collection.aggregate(pipeline_users))
        top_users = []
        for user_data in top_users_raw:
            user_id = user_data["_id"]
            if user_id:
                # Rechercher l'utilisateur dans la collection Users par son ID
                user = users_collection.find_one({"_id": ObjectId(user_id)})
                if user and "username" in user:
                    top_users.append({
                        "_id": user_id,
                        "username": user["username"],
                        "count": user_data["count"]
                    })
                else:
                    # Si l'utilisateur n'est pas trouvé ou n'a pas de nom d'utilisateur
                    top_users.append({
                        "_id": user_id,
                        "username": "Utilisateur inconnu",
                        "count": user_data["count"]
                    })
            else:
                # Si l'ID utilisateur est vide
                top_users.append({
                    "_id": None,
                    "username": "Système",
                    "count": user_data["count"]
                })
        
        # Volume de tickets traités par projet
        pipeline_project_volume = [
            {"$match": match_filter},
            {"$group": {
                "_id": "$client_project",
                "count": {"$sum": 1}
            }},
            {"$match": {"_id": {"$ne": None}}},  # Exclure les documents sans client_project
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        project_volume = list(history_collection.aggregate(pipeline_project_volume, allowDiskUse=True))
       
        # Compter les recherches avec succès vs échec
        success_searches = history_collection.count_documents({**match_filter, "result": {"$regex": "✅"}})
        error_searches = history_collection.count_documents({**match_filter, "result": {"$regex": "❌"}})
       
        # Estimation du taux d'automatisation basée sur le score de similarité
        # Les recherches avec un score > 70 sont considérées comme automatisables
        automatable_searches = history_collection.count_documents({
            **match_filter,
            "similarity_score": {"$gte": 70}
        })
        automation_rate = (automatable_searches / total_searches * 100) if total_searches > 0 else 0
        
        # Récupérer la liste des projets distincts depuis les messages d'historique
        all_projects_pipeline = [
            {"$match": {"client_project": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$client_project"}},
            {"$sort": {"_id": 1}}
        ]
        all_projects = list(history_collection.aggregate(all_projects_pipeline))
        project_list = [project["_id"] for project in all_projects]
       
        client.close()
       
        return {
            "status": "success",
            "stats": {
                "total_searches": total_searches,
                "searches_by_date": searches_by_date,
                "avg_response_time": avg_response_time,
                "top_users": top_users,
                "success_searches": success_searches,
                "error_searches": error_searches,
                "avg_similarity": avg_similarity,
                "similarity_distribution": similarity_distribution,
                "project_volume": project_volume,
                "automation_rate": automation_rate,
                "projects": project_list,
            }
        }
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques des recherches: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}"
        }
@app.get("/admin/stats/system", response_model=dict)
async def get_system_stats(current_user: dict = Depends(get_current_user)):
    """Récupère les statistiques système pour le dashboard admin."""
    # Vérifier que l'utilisateur est un admin
    if not current_user.get("isAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    
    try:
        import psutil
        import os
        
        # Utilisation CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Utilisation mémoire
        memory = psutil.virtual_memory()
        memory_usage = {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
            "used": memory.used,
            "free": memory.free
        }
        
        # Utilisation disque
        disk = psutil.disk_usage('/')
        disk_usage = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent
        }
        
        # Uptime du système
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        uptime_hours = uptime.total_seconds() / 3600
        
        return {
            "status": "success",
            "stats": {
                "cpu_percent": cpu_percent,
                "memory_usage": memory_usage,
                "disk_usage": disk_usage,
                "uptime_hours": uptime_hours
            }
        }
    
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques système: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques système: {str(e)}"
        }

@app.get("/admin/stats/users", response_model=dict)
async def get_users_stats(current_user: dict = Depends(get_current_user)):
    """Récupère les statistiques sur les utilisateurs pour le dashboard admin."""
    # Vérifier que l'utilisateur est un admin
    if not current_user.get("isAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    
    try:
        # Connexion à MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        db_access = client["Access"]
        users_collection = db_access["Users"]
        
        # Nombre total d'utilisateurs
        total_users = users_collection.count_documents({})
        
        # Nombre d'administrateurs
        admin_users = users_collection.count_documents({"isAdmin": True})
        
        # Utilisateurs par date d'inscription (regroupés par mois)
        pipeline_dates = [
            {"$project": {
                "month": {"$dateToString": {"format": "%Y-%m", "date": "$createdAt"}},
            }},
            {"$group": {"_id": "$month", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        users_by_month = list(users_collection.aggregate(pipeline_dates))
        
        client.close()
        
        return {
            "status": "success",
            "stats": {
                "total_users": total_users,
                "admin_users": admin_users,
                "regular_users": total_users - admin_users,
                "users_by_month": users_by_month
            }
        }
    
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques des utilisateurs: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}"
        }

@app.get("/admin/stats/database", response_model=dict)
async def get_database_stats(current_user: dict = Depends(get_current_user)):
    """Récupère les statistiques d'utilisation de la base de données MongoDB pour le dashboard admin."""
    # Vérifier que l'utilisateur est un admin
    if not current_user.get("isAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    
    try:
        # Connexion à MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        
        # Initialiser les variables pour stocker les tailles
        total_size = 0
        collections_info = []
        
        # Obtenir la taille des collections dans la base Access
        db_access = client["Access"]
        history_size = db_access.command("collStats", "Historique_Messages")["totalSize"]
        users_size = db_access.command("collStats", "Users")["totalSize"]
        
        # Obtenir la taille de la collection dans la base jira
        db_jira = client["jira"]
        tickets_size = db_jira.command("collStats", "tickets")["totalSize"]
        
        # Calculer la taille totale
        total_size = history_size + users_size + tickets_size
        
        # Calculer les pourcentages
        history_percent = (history_size / total_size) * 100 if total_size > 0 else 0
        users_percent = (users_size / total_size) * 100 if total_size > 0 else 0
        tickets_percent = (tickets_size / total_size) * 100 if total_size > 0 else 0
        
        # Préparer les informations des collections
        collections_info = [
            {
                "name": "Historique_Messages",
                "size": history_size,
                "percent": history_percent
            },
            {
                "name": "Users",
                "size": users_size,
                "percent": users_percent
            },
            {
                "name": "tickets",
                "size": tickets_size,
                "percent": tickets_percent
            }
        ]
        
        client.close()
        
        return {
            "status": "success",
            "stats": {
                "total_size": total_size,
                "collections": collections_info
            }
        }
    except Exception as e:
        print(f"Erreur lors de la récupération des statistiques de la base de données: {e}")
        return {
            "status": "error",
            "message": f"Erreur lors de la récupération des statistiques: {str(e)}"
        }

@app.post("/auth/refresh-token")
async def refresh_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token invalide ou manquant")
    
    token = auth_header.split(" ")[1]
    
    try:
        # Vérifier et décoder le token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Générer un nouveau token avec une nouvelle date d'expiration
        access_token_expires = timedelta(minutes=60)  # Token valide pour 60 minutes
        new_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        return {"access_token": new_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expiré ou invalide")

# Root endpoint for API health check 
@app.get("/") 
async def root(): 
    return {"status": "API is running", "version": "1.0.0"}



