# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha, **total minutos esta semana**, **días estudiados este mes** y lista de sesiones.
- Datos en localStorage con clave diario-estudio-sesiones y formato { date, topic, minutes } (compatible con clave antigua sesiones y formato { id, fecha, tema, minutos }).

## Decisiones (y por qué)
- Añadida " mejor racha\ (récord histórico) junto a racha actual. Se calcula sobre días únicos con sesiones, descartando fechas futuras, ordenando cronológicamente y detectando tramos consecutivos con fecha local.
- Cálculo separado de racha actual y mejor racha para no alterar la definición existente.
- Uso de Set para días únicos (varias sesiones mismo día cuentan como 1).
- Comparación por componentes locales (getFullYear/getMonth/getDate) para evitar desplazamiento UTC.
- Función pura calcularMejorRacha() para facilitar lectura.
- Migración automática de datos antiguos al cargar: si existe clave sesiones, se convierte al nuevo formato y se guarda en diario-estudio-sesiones.
- **Total minutos semana**: semana lunes–domingo (ISO/España), mostrado en la tarjeta de racha debajo de \Mejor racha\. Formato \X min\. Se recalcula al cargar y tras guardar.
- **Días estudiados este mes**: días únicos con sesión del 1 al hoy (sin futuras), mostrado en la tarjeta de racha. Función pura calcularDiasMes() con Set y comparación local.

## Aprendizajes y errores a evitar
- No usar toISOString() ni new Date(\AAAA-MM-DD\): usan UTC y desplazan día.
- No contar fechas futuras; no asumir orden en datos guardados.
- No duplicar días por varias sesiones.
- Mantener compatibilidad hacia atrás al cambiar formato/clave de datos.

## Próximos pasos
- (vacío por ahora)