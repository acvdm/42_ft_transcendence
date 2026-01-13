# 42_ft_transcendence

Projet de l'école 42, ft_transcendence consiste à concevoir une application web complète qui permet de jouer à Pong en multijoueur et en temps réel, avec une interface moderne, une gestion des utilisateurs et un environnement sécurisé sous Docker. 
Il combine frontend TypeScript, backend Node.js, WebSockets, et divers modules (auth, chat, IA, DevOps…) pour explorer l’architecture web full-stack.

## Prérequis
### Installation de Docker
#### Windows et Mac
1. Télécharger **Docker Desktop** : https://www.docker.com/products/docker-desktop/
2. Installer l'application (suivre l'assistant d'installation)
3. Lancez Docker Desktop et attendez qu'il affiche ¨Docker is running¨
4. Vérifiez l'installation en ouvrant le terminal:
```bash
docker --version

# Vérifier la version de Docker Compose
docker compose version
```

#### Linux (Ubuntu/Debian)
```bash
# Installer Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Appliquer les changements immédiatement
newgrp docker

# Vérifier l'installation
docker --version
docker compose version
```

## Lancement du projet
### Installation
```bash
# 1. Cloner le projet
git clone https://github.com/acvdm/42_ft_transcendence.git transcendence
cd transcendence

# 2. Lancer les services
Make

# Vérifier que les conteneurs (user, chat, auth, game, gateway, front, nginx) sont live
docker ps
```

L'application est disponible sur https://localhost:8443

### Script de création de match pour un user déjà créé
```bash
make add_stats user=<username>
```

### Arrêter l'application
```bash
# Arrêter les conteneurs
make down

# Réinitialisation complète
make prune
```

### Commandes utiles
```bash
# Vérifier l'état d'un docker
docker logs <nom_du_docker>
```

```bash
# Entrer dans un docker
docker exec -it <nom_du_docker> sh
```


## Architecture du projet

![architecture](/schema/architecture.png)

