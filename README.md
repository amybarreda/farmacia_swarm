````markdown
# 🏥 Farmacia – App en Microservicios con Docker Swarm

Esta aplicación es un sistema de gestión de farmacia desplegado como **microservicios** (backend + frontend) usando **Docker Swarm** y **HAProxy** como balanceador de carga.

Todo se levanta desde **un solo archivo** `docker-compose.yml`, que define:

- Base de datos **MariaDB**
- Microservicios backend:
  - `compras`
  - `inventario`
  - `usuarios`
  - `ventas`
- Aplicación de **frontend**
- **HAProxy** para el front
- **HAProxy** para el back

La arquitectura está pensada para 2 máquinas Ubuntu:

- `servidorUbuntu1` → corre **DB + backend + HAProxy back**
- `servidorUbuntu2` → corre **frontend + HAProxy front**

> Si no tienes estos hostnames, puedes cambiarlos en el archivo `docker-compose.yml`.

---

## ✅ 1. Requisitos previos

1. **Dos máquinas Ubuntu** (físicas o virtuales) con:
   - Acceso a Internet
   - Puertos abiertos:
     - 8080 y 9000 en `servidorUbuntu2` (front + stats front)
     - 8081 y 9001 en `servidorUbuntu1` (API back + stats back)
2. **Docker** instalado en ambas máquinas  
   Guía oficial: buscar “Install Docker Engine on Ubuntu”.
3. **Docker Swarm** inicializado (lo hacemos en el siguiente paso).
4. Opcional pero recomendado: que las máquinas tengan hostname:
   - `servidorUbuntu1`
   - `servidorUbuntu2`

Si usas otros nombres, deberás ajustar las líneas:

```yaml
placement:
  constraints:
    - node.hostname == servidorUbuntu1
    # o servidorUbuntu2
````

en el `docker-compose.yml`.

---

## 💾 2. Clonar el proyecto en las máquinas

Supongamos que usas el usuario `vagrant` y la ruta `/home/vagrant/farmaciadocker`
(esa ruta es la que usa el `docker-compose.yml` para montar los `haproxy.cfg`).

En **ambas máquinas**:

```bash
sudo mkdir -p /home/vagrant/farmaciadocker
sudo chown -R $USER:$USER /home/vagrant/farmaciadocker
cd /home/vagrant/farmaciadocker

git clone https://github.com/amybarreda/farmacia_swarm.git
cd farmacia_swarm
```

Estructura esperada (ejemplo):

```text
/home/vagrant/farmaciadocker/farmacia_swarm
└── stack-back/
    ├── docker-compose.yml
    ├── db/
    └── haproxy/
        └── haproxy.cfg
```

> En `servidorUbuntu2` deberías tener también la parte de `stack-front` y su `haproxy.cfg` si la tienes en otro repo/carpeta.
> El `docker-compose.yml` ya referencia:
>
> * `/home/vagrant/farmaciadocker/stack-front/haproxy/haproxy.cfg`
> * `/home/vagrant/farmaciadocker/stack-back/haproxy/haproxy.cfg`

Asegúrate de que esos archivos existan en esas rutas o ajusta las rutas en el compose.

---

## 🐳 3. Inicializar Docker Swarm

En **servidorUbuntu1** (manager):

```bash
docker swarm init --advertise-addr <IP_servidorUbuntu1>
```

La salida te dará un comando `docker swarm join ...`.

En **servidorUbuntu2** (worker), ejecuta el comando que te mostró el `init`, por ejemplo:

```bash
docker swarm join --token <TOKEN_WORKER> <IP_servidorUbuntu1>:2377
```

Puedes comprobar el cluster desde `servidorUbuntu1`:

```bash
docker node ls
```

---

## 📦 4. Servicios definidos en `docker-compose.yml`

El archivo `stack-back/docker-compose.yml` define todos los servicios:

* **Red overlay**: `farmanet`
* **Volumen**: `dbdata` para los datos de MariaDB
* Servicio `db` (MariaDB 10.11), con scripts SQL en `./db`
* Backend:

  * `compras`  (imagen: `amybarreda/compras-back:1.0`, puerto 3002)
  * `inventario` (imagen: `amybarreda/inventario-back:1.2`, puerto 3003)
  * `ventas` (imagen: `amybarreda/ventas-back:1.0`, puerto 3004)
  * `usuarios` (imagen: `amybarreda/usuarios-back:1.2`, puerto 3005)
* Frontend:

  * `front` (imagen: `amybarreda/front-web:1.0`)
* Balanceadores:

  * `haproxy_front` (puertos: 8080, 9000) → en `servidorUbuntu2`
  * `haproxy_back`  (puertos: 8081, 9001) → en `servidorUbuntu1`

Los microservicios usan la DB vía variables de entorno:

```yaml
DB_HOST: db
DB_USER: root
DB_PASSWORD: amymysql
DB_NAME: <compras|inventario|usuarios|ventas>
DB_PORT: "3306"
```

La base de datos se inicializa con los scripts SQL en la carpeta `db/`:

```yaml
volumes:
  - dbdata:/var/lib/mysql
  - ./db:/docker-entrypoint-initdb.d:ro
```

---

## 🚀 5. Desplegar toda la aplicación

Desde **servidorUbuntu1** (manager), en la carpeta donde está el compose:

```bash
cd /home/vagrant/farmaciadocker/stack-back
docker stack deploy -c docker-compose.yml farmacia
```

Esto creará un stack llamado `farmacia` con todos los servicios.

Puedes verificar:

```bash
docker stack services farmacia
docker service ls
docker ps
```

---

## 🌐 6. Cómo acceder a la aplicación

Una vez que todos los servicios estén en estado `Running`:

### 6.1. Frontend (lo que vería el usuario final)

En tu navegador, abre:

```text
http://<IP_servidorUbuntu2>:8080
```

Ahí deberías ver la interfaz web de la farmacia, servida a través de **HAProxy front** (`haproxy_front`).

### 6.2. API del backend (vía HAProxy back)

El balanceador del backend escucha en `servidorUbuntu1`:

```text
http://<IP_servidorUbuntu1>:8081/api/compras
http://<IP_servidorUbuntu1>:8081/api/usuarios
http://<IP_servidorUbuntu1>:8081/api/inventario
http://<IP_servidorUbuntu1>:8081/api/ventas
```

Las reglas están en `haproxy/haproxy.cfg` (backend):

* `/api/compras`    → servicio `compras` (puerto 3002)
* `/api/usuarios`   → servicio `usuarios` (puerto 3005)
* `/api/inventario` → servicio `inventario` (puerto 3003)
* `/api/ventas`     → servicio `ventas` (puerto 3004)

### 6.3. Paneles de estadísticas de HAProxy

* Frontend HAProxy (en `servidorUbuntu2`):

  ```text
  http://<IP_servidorUbuntu2>:9000/
  ```

* Backend HAProxy (en `servidorUbuntu1`):

  ```text
  http://<IP_servidorUbuntu1>:9001/
  ```

Usuario y contraseña por defecto (solo para pruebas):

```text
admin / admin
```

---

## 🧪 7. Datos iniciales y pruebas rápidas

La base de datos se crea e inicializa con los scripts dentro de `stack-back/db`:

* `01-compras.sql`
* `02-inventario.sql`
* `03-usuarios.sql`
* `04-ventas.sql`

Por ejemplo, en `01-compras.sql` se crea la BD `compras` y se insertan órdenes de compra de ejemplo.
Gracias a esto, al levantar la app ya tienes datos para probar.

### Probar la API directamente (ejemplos)

Desde tu máquina (o desde `servidorUbuntu1`):

```bash
curl http://<IP_servidorUbuntu1>:8081/api/compras
curl http://<IP_servidorUbuntu1>:8081/api/inventario
curl http://<IP_servidorUbuntu1>:8081/api/usuarios
curl http://<IP_servidorUbuntu1>:8081/api/ventas
```

---

## 📈 8. Escalar microservicios

Como los servicios corren en Swarm y HAProxy usa `server-template` con `tasks.<servicio>`, puedes escalar fácilmente.

Ejemplo: escalar el servicio de `compras` a 3 réplicas:

```bash
docker service scale farmacia_compras=3
```

HAProxy detectará automáticamente las nuevas tareas `tasks.compras` y las empezará a balancear.

---

## 🛑 9. Cómo detener y eliminar el stack

Para bajar todos los servicios del stack:

```bash
docker stack rm farmacia
```

El volumen `dbdata` puede seguir existiendo (dejando los datos).
Si quieres borrar el volumen:

```bash
docker volume ls
docker volume rm <nombre_del_volumen_dbdata>
```

---

## 👩‍💻 Autora

Proyecto desarrollado por **Amy Barreda**, **Juan Esteban Valencia**, **Ana Isabel Lopera** y **SAHARA NARVAEZ**.
Imágenes Docker públicas (backend y frontend) con el prefijo: `amybarreda/*`
Repositorio: [https://github.com/amybarreda/farmacia_swarm](https://github.com/amybarreda/farmacia_swarm)

```
