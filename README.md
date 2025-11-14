# Farmacia – Microservicios en Docker Swarm

Aplicación de gestión de farmacia desplegada como **microservicios en Docker Swarm**, repartida en **dos máquinas virtuales**:

- `servidorUbuntu1`: **manager** del Swarm, ejecuta el **backend** (`stack-back`) y la base de datos.
- `servidorUbuntu2`: **worker** del Swarm, ejecuta el **frontend** (`stack-front`).

Cada grupo (front y back) tiene su propio **balanceador de carga**.

---

## Arquitectura general

### Infraestructura

- 2 máquinas virtuales Linux (Ubuntu):
  - `servidorUbuntu1`  
    - Nodo **manager** del cluster Swarm.  
    - Carpeta `/farmaciadocker/stack-back`  
    - Ejecuta:
      - Microservicios de backend (`compras`, `inventario`, `usuarios`, `ventas`).
      - Servicio de base de datos **MariaDB** (carpeta `db`).
      - Balanceador de carga para el backend.
  - `servidorUbuntu2`  
    - Nodo **worker** del cluster Swarm.  
    - Carpeta `/farmaciadocker/stack-front`  
    - Ejecuta:
      - Aplicación de frontend.
      - Balanceador de carga para el frontend.

Ambas VMs tienen una carpeta base:

```text
/farmaciadocker
├── stack-back/   # en servidorUbuntu1 (backend + DB)
└── stack-front/  # en servidorUbuntu2 (frontend)
