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
   - `servidorUbuntu1` ip: 192.168.100.2
   - `servidorUbuntu2` ip: 192.168.100.3

Si usas otros nombres, deberás ajustar las líneas:

```yaml
placement:
  constraints:
    - node.hostname == servidorUbuntu1
    # o servidorUbuntu2
