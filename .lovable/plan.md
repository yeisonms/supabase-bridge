

## Agregar selector de ubicacion para pruebas

Como no hay gimnasios registrados cerca de tu ubicacion real, agregaremos un modo de prueba que te permita elegir una ubicacion manualmente.

### Que se hara

1. **Barra de ubicacion de prueba** - Se agregara un pequeno panel en la parte superior de la pagina Explorar con coordenadas editables (latitud y longitud) y un boton "Buscar aqui".

2. **Ubicaciones predefinidas** - Un selector con ciudades comunes (CDMX, Sao Paulo, Campinas, etc.) para seleccionar rapidamente sin tener que escribir coordenadas.

3. **Funcionamiento** - Al seleccionar una ubicacion o escribir coordenadas y presionar "Buscar aqui", se volvera a llamar al RPC `get_nearby_partners` con las nuevas coordenadas, actualizando la lista y el mapa.

### Detalles tecnicos

- **Archivo a modificar**: `src/pages/app/Explore.tsx`
- Se agregaran dos campos de input (lat/lng) y un select con ubicaciones predefinidas
- Se extraera la logica de busqueda a una funcion reutilizable `searchNearby(lat, lng)` que se llamara tanto al obtener la geolocalizacion como al cambiar manualmente las coordenadas
- El panel sera compacto y no afectara la experiencia visual del mapa o la lista
- Se podra ocultar o remover facilmente cuando ya no se necesite para pruebas

