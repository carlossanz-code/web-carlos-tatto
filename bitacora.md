# Bitácora - Práctica Nextcloud con Docker Compose

**Alumno:** Carlos Sanz  
**Curso:** 2.º SMR V  
**Fecha:** 16/11/2026  
**Empresa ficticia:** Carlos Tatto  
**Equipo:** PC716  
**Carpeta del proyecto:** `~/nextcloud-carlos`  
**Puerto:** `8081`  
**IP local:** `10.20.7.16`  
**Administrador:** `admin-carlostatto`

## Parte 1. Preparación

Comprobé las versiones de Docker y Compose y creé la carpeta del proyecto. Consulté la IP con `ip a`, preparé `docker-compose.yml` con dos servicios (`db` y `app`) y comprobé el archivo con `docker compose config --quiet`.

```bash
docker --version
docker compose version
mkdir -p ~/nextcloud-carlos
cd ~/nextcloud-carlos
ip a
nano docker-compose.yml
docker compose config --quiet
```

En mi archivo utilicé MariaDB 11.8, Nextcloud, los volúmenes `db_data` y `nextcloud_data`, el puerto `8081:80`, la IP de confianza `10.20.7.16` y el usuario `admin-carlostatto`. Las contraseñas son de prueba y no las reproduzco en esta bitácora.

**Pregunta 1.** `MARIADB_PASSWORD` y `MYSQL_PASSWORD` deben ser iguales. Si no lo son, Nextcloud no se conecta a la base de datos.

**Pregunta 2.** `./web` de la landing era una carpeta local montada en el contenedor (bind mount). `db_data` es un volumen con nombre que administra Docker y conserva los datos aunque elimine el contenedor.


## Parte 2. Instalación y acceso

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs -f app
```

Los dos contenedores arrancaron en estado `Up`: `nc-app-carlos` y `nc-db-carlos`.

**Errores reales y cómo los resolví:**

| Problema | Solución o resultado |
|---|---|
| `permission denied` al conectar con `/var/run/docker.sock` | Volví a ejecutar los comandos Docker con `sudo`. |
| `SQLSTATE[HY000] [2002] Connection refused` al instalar Nextcloud | MariaDB todavía no estaba lista. El instalador reintentó la conexión y después mostró `Nextcloud was successfully installed`. |
| Aviso de Apache sobre `ServerName` | El servicio continuó funcionando; anoté el aviso, pero no hizo falta modificarlo para esta práctica. |

Entré en `http://localhost:8081` con `admin-carlostatto`, comprobé la pantalla de usuarios y accedí desde `http://10.20.7.16:8081`. Un compañero también pudo abrir la pantalla de acceso desde su ordenador.

**Pregunta 3.** Hay que esperar a que termine la instalación porque Nextcloud necesita preparar la aplicación y la base de datos. Si entro antes, puede no cargar o dar un error. En mi caso hubo un fallo temporal de conexión y luego se instaló.

**Pregunta 4.** Sí, un compañero pudo acceder desde otro PC. Lo permite la publicación del puerto `8081:80`; `NEXTCLOUD_TRUSTED_DOMAINS` también debe aceptar mi IP.

**Pregunta 5.** Dos avisos de la Vista general:

1. **Accés HTTPS i URL:** estoy usando HTTP sin cifrado. En una instalación real haría falta configurar HTTPS.
2. **Inici de la finestra de manteniment:** no está definida la hora de las tareas de mantenimiento; sería mejor programarlas en horario de poco uso.

Otros avisos visibles: migraciones MIME, configuración de base de datos, cabeceras HTTP, AppAPI deploy daemon, errores en el registro y bloqueo de archivos transaccional. Los he dejado para la sesión de seguridad.


## Parte 3. Persistencia y occ

Subí la carpeta `CARLOS-TATTO-V11` a Nextcloud y comprobé los contenedores. Después del reinicio, la carpeta seguía visible en Archivos. Después ejecuté:

```bash
sudo docker compose down
sudo docker ps -a
sudo docker compose up -d
sudo docker compose ps
sudo docker volume ls
sudo docker volume inspect nextcloud-carlos_nextcloud_data
sudo docker exec -u www-data nc-app-carlos php occ status
sudo docker exec -u www-data nc-app-carlos php occ user:list
```

`down` eliminó `nc-app-carlos` y `nc-db-carlos`. `up -d` los creó de nuevo y ambos quedaron `Up`. Los volúmenes seguían presentes.

**Pregunta 6.** `docker compose down` elimina los contenedores, pero no los volúmenes donde se guardan los datos. Por eso los datos almacenados en esos volúmenes se conservan al arrancar otra vez. En la captura de Archivos tomada tras volver a levantar los contenedores se ve que la carpeta `CARLOS-TATTO-V11` sigue apareciendo.

**Pregunta 7.** El prefijo `nextcloud-carlos` sale del nombre del proyecto Docker Compose (la carpeta del proyecto); `nextcloud_data` es el nombre del volumen que definí en el YAML.

**Pregunta 8.** `docker compose down -v` también elimina los volúmenes. No lo ejecuté porque podría borrar la información de la empresa.

**Pregunta 9.** Según `occ status`, mi Nextcloud es la versión **35.0.3** (interna `35.0.3.2`). `occ user:list` devuelve `admin-carlostatto`.

**Volúmenes observados:**

```text
nextcloud-carlos_db_data
nextcloud-carlos_nextcloud_data
```

**Ruta de los datos de Nextcloud:**

```text
/var/lib/docker/volumes/nextcloud-carlos_nextcloud_data/_data
```
