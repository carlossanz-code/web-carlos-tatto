# Nextcloud con Docker Compose — Carlos Tatto

**Alumno:** Carlos Sanz · **Curso:** 2.º SMR V  
**Fecha:** 16 de noviembre de 2026 · **Equipo:** PC716

## Objetivo

He instalado Nextcloud para una empresa ficticia llamada **Carlos Tatto** usando dos contenedores de Docker: uno para Nextcloud y otro para MariaDB. He comprobado que puedo entrar desde mi ordenador y desde otro PC de la red, y que los datos siguen guardados después de eliminar y volver a crear los contenedores.

## Configuración

| Elemento | Valor |
| --- | --- |
| Empresa | Carlos Tatto |
| Proyecto | `nextcloud-carlos` |
| Contenedor web | `nc-app-carlos` |
| Contenedor de base de datos | `nc-db-carlos` |
| Puerto web | `8081` |
| IP del PC en el aula | `10.20.7.16` |
| Administrador | `admin-carlostatto` |
| Nextcloud instalado | `35.0.3` |
| Base de datos | MariaDB `11.8` |

## Parte 1. Preparación

Comprobé Docker y Docker Compose, consulté la IP con `ip a` y preparé el archivo `docker-compose.yml`. El servicio `db` guarda la base de datos y el servicio `app` publica Nextcloud en el puerto 8081. Para comprobar la estructura utilicé:

```bash
docker compose config --quiet
```

Los dos volúmenes con nombre son `db_data` y `nextcloud_data`. El contenedor de la aplicación se conecta a la base de datos por el nombre de servicio `db`.

## Parte 2. Instalación y acceso

Arranqué y comprobé los dos contenedores:

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs -f app
```

Al principio tuve un problema de permisos con Docker y usé `sudo`. En el primer intento Nextcloud encontró la base de datos todavía sin preparar (`Connection refused`), pero el instalador reintentó la conexión y completó la instalación.

Pude acceder desde `http://localhost:8081` y `http://10.20.7.16:8081`. También comprobé con un compañero que la pantalla de acceso era accesible desde otro equipo de la red.

En **Administración → Vista general** aparecieron avisos de HTTPS, la ventana de mantenimiento, migraciones MIME, cabeceras HTTP y otros ajustes. Los anoté para la parte de seguridad de la práctica.

## Parte 3. Persistencia y administración

Después de añadir la carpeta `CARLOS-TATTO-V11` en Nextcloud, eliminé los contenedores (sin borrar los volúmenes) y los levanté otra vez:

```bash
sudo docker compose down
sudo docker ps -a
sudo docker compose up -d
sudo docker compose ps
```

Comprobé en Archivos que la carpeta seguía visible. Para inspeccionar el almacenamiento y consultar Nextcloud desde la terminal utilicé:

```bash
sudo docker volume ls
sudo docker volume inspect nextcloud-carlos_nextcloud_data
sudo docker exec -u www-data nc-app-carlos php occ status
sudo docker exec -u www-data nc-app-carlos php occ user:list
```

`occ status` confirmó que estaba instalado Nextcloud **35.0.3** y `occ user:list` mostró `admin-carlostatto`.

**No ejecuté `docker compose down -v`**, ya que ese comando también elimina los volúmenes del proyecto.

## Evidencias

Las capturas originales de las comprobaciones realizadas están en [`capturas/`](capturas/):

| Captura | Qué demuestra |
| --- | --- |
| [01 — Contenedores](capturas/01_contenedores_activos.png) | Nextcloud y MariaDB en estado `Up`. |
| [02 — Logs](capturas/02_logs_instalacion.png) | Instalación terminada correctamente. |
| [03 — Interfaz](capturas/03_inicio_nextcloud.png) | Acceso al panel de Nextcloud. |
| [04 — Administrador](capturas/04_usuario_admin.png) | Cuenta `admin-carlostatto` creada. |
| [05 — Persistencia](capturas/05_carpeta_tras_reinicio.png) | Carpeta `CARLOS-TATTO-V11` visible tras reiniciar. |
| [06 — Eliminación](capturas/06_contenedores_eliminados.png) | Eliminación de contenedores con `down`. |
| [07 — Recreación](capturas/07_contenedores_recreados.png) | Contenedores levantados de nuevo. |
| [08 — Avisos](capturas/08_avisos_administracion.png) | Avisos reales de seguridad y configuración. |
| [09 — Acceso por IP](capturas/09_acceso_desde_ip.png) | Nextcloud desde `10.20.7.16:8081`. |


## Web de Carlos Tatto

Además de la instalación de Nextcloud, he incluido en este repositorio la web del estudio ficticio:

- [Abrir el HTML de Carlos Tatto](CARLOS-TATTO-V11/index.html)
- [Carpeta completa de la web](CARLOS-TATTO-V11/)

La web está organizada en archivos separados de HTML, CSS y JavaScript, con imágenes locales y los 96 fotogramas de la animación de la máquina. Para verla desde un navegador en el ordenador:

```bash
cd CARLOS-TATTO-V11
python3 -m http.server 8000
```

Luego abro `http://localhost:8000`. Esta web es un proyecto independiente guardado en el mismo repositorio para mostrar los archivos de la empresa ficticia. No hace falta ejecutarla para que Nextcloud funcione.

## Documentación adicional

También he guardado una versión de la práctica en [PDF](documentacion/Practica_Nextcloud_Carlos_Sanz_2SMR_V.pdf) y en [Word editable](documentacion/Practica_Nextcloud_Carlos_Sanz_2SMR_V.docx).

## Bitácora

En [`bitacora.md`](bitacora.md) están los comandos, los problemas reales y mis respuestas a **las 9 preguntas de la práctica**.

## Nota sobre las contraseñas

Este repositorio muestra una configuración de ejemplo con variables de entorno. Las contraseñas que se utilizan en la instalación local se almacenan en `.env`, que está excluido del repositorio. No deben publicarse credenciales en GitHub.
