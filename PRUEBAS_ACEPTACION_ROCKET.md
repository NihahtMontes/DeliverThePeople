# Pruebas de aceptacion - Modulo B: Equipo Rocket

## 1. Objetivo

Esta guia permite verificar manualmente los 12 casos de uso del Equipo Rocket y reunir evidencia de que el modulo funciona con autenticacion, roles y persistencia en Supabase.

Fecha de preparacion de la guia: 15 de junio de 2026.

## 2. Estado inicial confirmado

La base de datos conectada contiene:

- 1 sucursal: `Cochabamba Centro`.
- 5 empleados activos.
- 0 horarios de prueba.
- 0 tareas de prueba.
- 0 areas de prueba.
- 0 incidencias RRHH de prueba.

Usuarios disponibles:

| Usuario | Rol | Contrasena |
| --- | --- | --- |
| `admin@dtp.com` | admin | `contra123` |
| `gerente@dtp.com` | gerente | `contra123` |
| `cocinero@dtp.com` | cocinero | `contra123` |
| `despachador@dtp.com` | despachador | `contra123` |
| `tecnico@dtp.com` | tecnico | `contra123` |

Estas son cuentas de demostracion. No se deben reutilizar sus contrasenas en produccion.

## 3. Preparacion

1. Abre una terminal en la raiz del proyecto.
2. Ejecuta:

```bash
bun run dev
```

3. Confirma que aparezcan ambos mensajes:

```text
Servidor corriendo en http://localhost:3001
Local: http://localhost:5173/
```

4. Abre `http://localhost:3001/api/health`.
5. Debe responder un JSON con `"status":"ok"`.
6. Abre `http://localhost:5173`.
7. Inicia sesion con `admin@dtp.com` y `contra123`.

Si aparece `port 3001 is in use`, cierra la otra terminal que ya ejecuta el backend o presiona `Ctrl + C` antes de volver a iniciar.

## 4. Evidencia recomendada

Para cada bloque toma una captura que muestre:

- URL o nombre de la pagina.
- Usuario o rol conectado.
- Registro creado o estado modificado.
- Mensaje de exito cuando exista.

En la tabla final de esta guia marca cada resultado como `OK` o `FALLO`.

## 5. Pruebas de empleados

### P01 - CU1 Registrar personal con credenciales

1. Entra en `/empleados` como admin.
2. Pulsa `Nuevo empleado`.
3. Registra:

```text
Nombre: Prueba
Apellido: Rocket
Email: prueba.rocket@dtp.com
Contrasena: contra123
Rol: aseo
Sucursal: Cochabamba Centro
Estado: activo
```

Resultado esperado:

- El modal se cierra.
- Aparece un mensaje de exito.
- El empleado aparece en la tabla.
- Puede iniciar sesion con `prueba.rocket@dtp.com` y `contra123`.

### P02 - Validaciones y correo duplicado

1. Intenta crear otro empleado con `prueba.rocket@dtp.com`.
2. Intenta usar una contrasena de menos de 6 caracteres.
3. Intenta dejar nombre, apellido o email vacios.

Resultado esperado:

- El correo repetido es rechazado con un mensaje claro.
- La contrasena corta es rechazada.
- Los campos obligatorios son validados.
- No se crea ningun registro invalido.

### P03 - CU2 Actualizar datos del personal

1. Edita a `Prueba Rocket`.
2. Cambia el apellido a `Rocket Editado`.
3. Deja la nueva contrasena vacia.
4. Guarda.

Resultado esperado:

- La tabla muestra `Prueba Rocket Editado`.
- La sesion sigue funcionando con `contra123`, porque dejar la contrasena vacia conserva la anterior.

### P04 - CU4 Consultar personal por sucursal

1. En `/empleados`, selecciona `Cochabamba Centro` en el filtro de sucursal.
2. Prueba tambien los filtros de rol, estado y buscador.

Resultado esperado:

- Solo aparecen registros que cumplen todos los filtros seleccionados.
- Nombre, apellido, email, rol, sucursal y estado son visibles.
- Nunca aparece `password_hash`.

### P05 - CU7 Baja logica y reactivacion

1. Da de baja a `Prueba Rocket Editado`.
2. Confirma la accion.
3. Cierra sesion e intenta entrar con esa cuenta.
4. Regresa como admin y reactiva al empleado.
5. Intenta iniciar sesion nuevamente con la cuenta reactivada.

Resultado esperado:

- El empleado no desaparece: cambia a `inactivo`.
- Una cuenta inactiva no puede iniciar sesion.
- Al reactivarla vuelve a poder iniciar sesion.
- El admin conectado no puede darse de baja a si mismo.

## 6. Pruebas de horarios

### P06 - CU3 Asignar horario

1. Entra como admin en `/horarios`.
2. Abre la pestana `RRHH - Todos los Turnos`.
3. Crea un horario para `Prueba Rocket Editado` con la fecha actual.
4. Guarda el horario.

Resultado esperado:

- El turno aparece en la tabla con empleado, fecha y estado.
- Intentar crear otro horario para el mismo empleado y fecha devuelve un mensaje de duplicado.

### P07 - CU5 Verificar cumplimiento

Esta prueba se realiza en tres momentos sobre el mismo registro:

#### Momento 1 - Pendiente

1. Crea el horario indicando empleado y fecha.
2. Deja `Hora de ingreso (opcional)` con la hora en `--`.
3. Busca el registro en la tabla.
4. Antes de marcar una hora, confirma que muestre:
   - Entrada: `---`.
   - Salida: `---`.
   - Estado: `PENDIENTE`.
   - Accion disponible: `Registrar entrada`.
5. Toma una captura de este estado inicial.

#### Momento 2 - En curso

Puedes obtener este estado de dos maneras:

- Al crear el horario, selecciona una hora en `Hora de ingreso (opcional)` y guarda.
- Desde un registro pendiente, pulsa `Registrar entrada` y confirma la hora actual.

Confirma que la misma fila ahora muestre:
   - Una hora de entrada con `AM` o `PM`.
   - Salida: `---`.
   - Estado: `EN CURSO`.
   - Accion disponible: `Registrar salida`.
5. Toma una captura antes de registrar la salida. Esta captura demuestra el estado `EN CURSO`.

#### Momento 3 - Completado

1. Pulsa `Registrar salida` para usar la hora actual, o pulsa `Editar` para elegir manualmente hora, minutos y `AM/PM`.
2. Confirma o guarda la hora de salida.
3. Confirma que la fila muestre:
   - Hora de entrada.
   - Hora de salida.
   - Estado: `COMPLETADO`.
   - Ya no aparecen botones para volver a registrar entrada o salida.
4. Toma una segunda captura. Esta captura demuestra el estado `COMPLETADO`.

Resultado esperado:

- Las horas se muestran claramente en formato `AM/PM`.
- El flujo visible es `PENDIENTE` -> `EN CURSO` -> `COMPLETADO`.
- La entrada puede seleccionarse al crear o registrarse con la hora actual, y habilita la salida.
- La salida puede seleccionarse al editar o registrarse con la hora actual, y cierra el turno.
- El indicador de puntualidad se muestra con la referencia visual disponible.
- La API no permite salida sin entrada, entrada repetida ni salida repetida.
- Si necesitas corregir una hora, usa `Editar`, donde hay selectores separados de hora, minutos y `AM/PM`.

### P08 - CU6 Modificar horario

1. Edita el registro creado.
2. Cambia la fecha o las horas.
3. Confirma la advertencia si el registro ya esta completado.

Resultado esperado:

- Los nuevos valores se guardan.
- La tabla se actualiza sin recargar manualmente la pagina.

## 7. Pruebas de tareas

### P09 - CU8 Asignar tareas

1. Inicia sesion como admin.
2. Entra en `/tareas`.
3. Asigna a `Prueba Rocket Editado` la tarea:

```text
Titulo: Limpiar area de prueba Rocket
Sucursal: Cochabamba Centro
```

Resultado esperado:

- La tarea aparece en el listado administrativo.
- Su estado inicial es `PENDIENTE`.

### P10 - CU9 Consultar tareas asignadas

1. Cierra sesion.
2. Inicia como `prueba.rocket@dtp.com` con `contra123`.
3. Abre `/tareas`.

Resultado esperado:

- Se muestra la vista `Mis tareas`.
- La tarea asignada aparece en el tablero.
- No aparecen tareas de otros empleados.

### P11 - CU11 Reportar cumplimiento

1. En la tarea propia, pulsa la accion para iniciarla.
2. Confirma que pase a `EN_PROCESO`.
3. Pulsa `Marcar completada`.

Resultado esperado:

- La tarea pasa a `COMPLETADA`.
- El cambio persiste al recargar la pagina.
- El usuario no puede modificar una tarea ajena.

## 8. Pruebas de areas

### P12 - Crear y editar area de apoyo

1. Inicia como admin.
2. Entra en `/areas`.
3. Crea:

```text
Nombre: Area de prueba Rocket
Descripcion: Area temporal para validacion del modulo
Sucursal: Cochabamba Centro
```

4. Edita la descripcion y guarda.

Resultado esperado:

- El area aparece como tarjeta.
- El detalle muestra su sucursal y el personal activo de esa sucursal.
- Admin y gerente tienen acciones de mantenimiento.

### P13 - CU10 Consultar areas asignadas

1. Inicia como `prueba.rocket@dtp.com`.
2. Abre `/areas`.

Resultado esperado:

- Puede consultar las areas de su sucursal.
- No aparecen botones para crear o editar.
- La pantalla indica que el esquema actual relaciona personal y areas mediante sucursal.

Nota de aceptacion:

La base no tiene `empleado_id` en `areas` ni una tabla intermedia empleado-area. Por eso no existe una asignacion individual persistente. CU10 queda implementado como consulta de areas correspondientes a la sucursal del empleado. Esta limitacion debe explicarse al grupo y al docente.

## 9. Pruebas de incidencias

### P14 - CU12 Reportar incidente del personal

1. Inicia como `prueba.rocket@dtp.com`.
2. Abre `/incidencias`.
3. Debe mostrarse la vista `RRHH - Personal`.
4. Registra una incidencia de prueba con una descripcion identificable.

Resultado esperado:

- El reporte se crea para el propio empleado y su sucursal.
- El reporte aparece inmediatamente en la seccion `Mis reportes` del empleado.
- El empleado puede consultar fecha, tipo, prioridad, estado y detalle de sus propios reportes.
- El operativo no puede consultar reportes pertenecientes a otros empleados ni usar acciones administrativas.

### P15 - Gestion administrativa de incidencia

1. Inicia como admin.
2. Abre `/incidencias`.
3. Cambia a la pestana `RRHH - Personal`.
4. Busca la incidencia creada y modifica su estado.
5. Vuelve a la pestana de Cocina.

Resultado esperado:

- Admin puede consultar y gestionar la incidencia RRHH.
- La incidencia RRHH no aparece mezclada en la pestana de Cocina.
- El contenido original de Cocina sigue disponible.

## 10. Pruebas de roles y seguridad

### P16 - Gerente

1. Inicia como `gerente@dtp.com` con `contra123`.
2. Revisa `/empleados`, `/horarios`, `/tareas`, `/areas` e `/incidencias`.

Resultado esperado:

- Puede gestionar datos de `Cochabamba Centro`.
- No puede crear o convertir empleados al rol `admin`.
- No puede administrar usuarios admin.
- Si existiera otra sucursal, no deberia administrar sus registros.

### P17 - Usuario operativo

1. Inicia como `cocinero@dtp.com`, `tecnico@dtp.com` o la cuenta de aseo creada.
2. Intenta abrir manualmente `http://localhost:5173/empleados` y `/horarios`.

Resultado esperado:

- `PrivateRoute` impide acceder a paginas administrativas.
- El operativo puede acceder solamente a las vistas permitidas para su rol.

### P18 - Sesion y datos sensibles

1. Cierra sesion y abre directamente `/empleados`.
2. Abre las herramientas del navegador, pestana `Network`.
3. Revisa una respuesta de `/api/empleados`.

Resultado esperado:

- Sin sesion se redirige a `/login`.
- Las peticiones protegidas sin token responden HTTP `401`.
- Ninguna respuesta contiene `password_hash`.

## 11. Prueba de no regresion del Modulo A

Realiza una comprobacion rapida, sin modificar datos importantes:

- Abre Dashboard.
- Abre Pedidos/Ordenes.
- Abre Inventario.
- Abre Equipos.
- Abre Mantenimientos.
- Abre Pagos.
- Abre Delivery.
- Abre la pestana de incidencias de Cocina.

Resultado esperado:

- Las paginas cargan sin pantalla blanca.
- Navegacion, Navbar, Sidebar, autenticacion y layout siguen funcionando.
- Las rutas historicas `/api/pedidos`, `/api/inventario`, `/api/equipos`, `/api/mantenimientos`, `/api/pagos` y `/api/incidencias` siguen disponibles.

## 12. Matriz final de aceptacion

| Prueba | CU relacionado | Resultado | Evidencia |
| --- | --- | --- | --- |
| P01 Registrar empleado | CU1 | Pendiente | Captura |
| P02 Validaciones | CU1 | Pendiente | Captura |
| P03 Actualizar empleado | CU2 | Pendiente | Captura |
| P04 Filtrar por sucursal | CU4 | Pendiente | Captura |
| P05 Baja/reactivacion | CU7 | Pendiente | Captura |
| P06 Asignar horario | CU3 | Pendiente | Captura |
| P07 Cumplimiento horario | CU5 | Pendiente | Captura |
| P08 Modificar horario | CU6 | Pendiente | Captura |
| P09 Asignar tarea | CU8 | Pendiente | Captura |
| P10 Consultar tarea propia | CU9 | Pendiente | Captura |
| P11 Completar tarea | CU11 | Pendiente | Captura |
| P12 Crear/editar area | Apoyo CU10 | Pendiente | Captura |
| P13 Consultar areas | CU10 | Pendiente | Captura |
| P14 Reportar incidencia | CU12 | Pendiente | Captura |
| P15 Gestionar incidencia | CU12 | Pendiente | Captura |
| P16 Permisos de gerente | Seguridad | Pendiente | Captura |
| P17 Permisos operativos | Seguridad | Pendiente | Captura |
| P18 Auth/datos sensibles | Seguridad | Pendiente | Network |
| No regresion Modulo A | Integracion | Pendiente | Capturas |

## 13. Criterio para declarar el modulo aprobado

El modulo puede presentarse como aprobado cuando:

- P01 a P18 tienen resultado `OK`.
- La prueba de no regresion no muestra fallos nuevos.
- No aparece `password_hash` en respuestas.
- Admin, gerente y operativo muestran permisos diferentes y correctos.
- Los datos creados persisten despues de recargar.
- La limitacion de CU10 se comunica expresamente y no se presenta como asignacion individual.
- Se conservan capturas o un video corto como evidencia.

Si una prueba falla, anota el mensaje exacto, usuario utilizado, URL, hora y captura de `Network` antes de cambiar codigo. Esa informacion permite reproducir y corregir el problema.
