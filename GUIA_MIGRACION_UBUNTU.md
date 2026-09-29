# Guía Paso a Paso: Configuración y Despliegue de Cong Alameda en Ubuntu

Esta guía detalla el procedimiento completo para clonar y ejecutar el entorno de desarrollo (Base de Datos Docker, Backend Go y Frontend Angular) en una instalación nativa de Ubuntu Linux.

---

## 1. Prerrequisitos en Ubuntu

Asegurate de contar con las herramientas base instaladas en Ubuntu. Abrí una terminal y ejecutá:

### 1.1 Actualizar paquetes y herramientas básicas
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 1.2 Instalar Docker y Docker Compose
```bash
# 1. Instalar dependencias
sudo apt install -y ca-certificates gnupg lsb-release

# 2. Agregar la clave GPG oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Configurar el repositorio de Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Instalar Docker Engine y Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Habilitar ejecución sin 'sudo'
sudo usermod -aG docker $USER
newgrp docker
```
*Verificá la instalación:*
```bash
docker compose version
```

### 1.3 Instalar Go (1.21 o superior)
```bash
# Descarga e instalación de Go (ejemplo versión 1.22)
curl -OL https://go.dev/dl/go1.22.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.22.6.linux-amd64.tar.gz
rm go1.22.6.linux-amd64.tar.gz

# Agregar al PATH en ~/.bashrc
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

go version
```

### 1.4 Instalar Node.js (v20+ LTS) y npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
```

---

## 2. (Opcional) Exportar Datos Actuales desde Windows

Si ya tenés datos cargados en Windows que no querés perder:

1. En Windows (con Docker levantado), abrí PowerShell en la carpeta del proyecto y ejecutá:
   ```powershell
   docker compose exec -T db pg_dump -U app cong_alameda > backup_cong_alameda.sql
   ```
2. Guardá el archivo `backup_cong_alameda.sql` en un pendrive o partición compartida para transferirlo a Ubuntu.

---

## 3. Clonar el Proyecto en Ubuntu

> **Importante:** Cloná el proyecto dentro de tu directorio home de Ubuntu (partición nativa `ext4`, ej: `~/proyectos/`), **NO** dentro del disco de Windows montado.

```bash
mkdir -p ~/proyectos
cd ~/proyectos

# Cloná tu repositorio (reemplazá con la URL real de tu repositorio)
git clone <URL_DEL_REPOSITORIO> cong_alameda
cd cong_alameda
```

---

## 4. Levantar la Base de Datos con Docker

El proyecto utiliza PostgreSQL 15 definido en `docker-compose.yml` mapeado en el puerto **`5499`**.

1. Levantá el servicio de base de datos:
   ```bash
   docker compose up -d db
   ```

2. Verificá que el contenedor esté corriendo y saludable (`healthy`):
   ```bash
   docker compose ps
   ```

3. (Opcional) Si hiciste el backup en el paso 2, restaurá los datos:
   ```bash
   docker compose exec -T db psql -U app -d cong_alameda < /ruta/a/backup_cong_alameda.sql
   ```

---

## 5. Configurar y Ejecutar el Backend (Go)

1. Ingresá a la carpeta `backend`:
   ```bash
   cd ~/proyectos/cong_alameda/backend
   ```

2. Creá tu archivo `.env`:
   ```bash
   cp .env.example .env
   ```

3. Verificá o editá las variables en `backend/.env`:
   ```env
   # Conexión a la base de datos de Docker en el puerto 5499
   DATABASE_URL=postgres://app:password123@127.0.0.1:5499/cong_alameda?sslmode=disable

   # Clave secreta JWT
   JWT_SECRET=tu-super-secreto-cambiar-en-produccion-12345
   JWT_EXPIRY_HOURS=24

   # Puerto del servidor Backend
   PORT=8085
   ENV=development

   # URL del Frontend
   FRONTEND_URL=http://localhost:4200

   # Directorio para subida de archivos
   UPLOADS_DIR=./uploads
   ```

4. Descargá las dependencias de Go:
   ```bash
   go mod download
   ```

5. Corré las pruebas unitarias para validar el entorno:
   ```bash
   go test -v ./internal/services ./internal/handlers
   ```

6. Iniciá el servidor backend (al iniciar aplicará automáticamente cualquier migración pendiente):
   ```bash
   go run ./cmd/server
   ```
   *Deberías ver el mensaje: `Connected to database successfully` y el servidor escuchando en el puerto `8085`.*

---

## 6. Configurar y Ejecutar el Frontend (Angular 21)

Abrí una **segunda terminal** en Ubuntu:

1. Ingresá a la carpeta `frontend`:
   ```bash
   cd ~/proyectos/cong_alameda/frontend
   ```

2. Instalá las dependencias npm para Linux:
   ```bash
   npm install
   ```

3. Verificá que los tests de frontend pasen:
   ```bash
   npm test -- --watchAll=false
   ```

4. Iniciá el servidor de desarrollo de Angular:
   ```bash
   npm start
   ```

5. Abrí tu navegador en:
   ```
   http://localhost:4200
   ```

---

## 7. Comandos de Referencia Rápida

| Acción | Comando | Directorio |
|---|---|---|
| **Iniciar DB Docker** | `docker compose up -d db` | Raíz (`cong_alameda/`) |
| **Detener DB Docker** | `docker compose down` | Raíz (`cong_alameda/`) |
| **Ver logs de DB** | `docker compose logs -f db` | Raíz (`cong_alameda/`) |
| **Iniciar Backend** | `go run ./cmd/server` | `backend/` |
| **Tests Backend** | `go test ./internal/services ./internal/handlers` | `backend/` |
| **Iniciar Frontend** | `npm start` | `frontend/` |
| **Tests Frontend** | `npm test` | `frontend/` |

---

## 8. Diagnóstico de Problemas Comunes

* **Error: `permission denied while trying to connect to the Docker daemon socket`**:
  Ejecutá `sudo usermod -aG docker $USER` y reiniciá tu sesión de usuario en Ubuntu.
* **Error: `failed to connect to host=127.0.0.1 port=5499`**:
  Comprobá que el contenedor de Docker esté activo con `docker compose ps`. Si no está corriendo, ejecutá `docker compose up -d db`.
* **Conexión externa (DBeaver / DataGrip / pgAdmin)**:
  - **Host**: `127.0.0.1` o `localhost`
  - **Puerto**: `5499`
  - **Base de datos**: `cong_alameda`
  - **Usuario**: `app`
  - **Contraseña**: `password123`
