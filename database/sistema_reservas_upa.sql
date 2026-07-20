-- =============================================================================
--  SISTEMA DE RESERVAS UPA  ·  Universidad Politécnica
--  Modelo Entidad-Relación completo  ·  Motor: MySQL 8.x (InnoDB / utf8mb4)
--  16 tablas · 2 tablas pivote M:N · datos de ejemplo · reglas de negocio
-- =============================================================================

DROP DATABASE IF EXISTS reservas_upa;
CREATE DATABASE reservas_upa
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE reservas_upa;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
--  1. CATÁLOGOS BASE (sin dependencias)
-- =============================================================================

-- ---------- ROL ----------
CREATE TABLE rol (
    rol_id      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol  VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------- CARRERA ----------
CREATE TABLE carrera (
    carrera_id  INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    codigo      VARCHAR(15)  NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------- EDIFICIO ----------
CREATE TABLE edificio (
    edificio_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    codigo      VARCHAR(15)  NOT NULL UNIQUE,
    ubicacion   VARCHAR(150),
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

-- ---------- TIPO_ESPACIO ----------
CREATE TABLE tipo_espacio (
    tipo_id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo       VARCHAR(50) NOT NULL UNIQUE,
    descripcion       VARCHAR(255),
    capacidad_default INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------- ESTADO_RESERVA ----------
CREATE TABLE estado_reserva (
    estado_id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =============================================================================
--  2. USUARIOS Y PERFILES
-- =============================================================================

-- ---------- USUARIO ----------
CREATE TABLE usuario (
    usuario_id    INT AUTO_INCREMENT PRIMARY KEY,
    rol_id        INT NOT NULL,
    nombre        VARCHAR(60)  NOT NULL,
    apellido      VARCHAR(60)  NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono      VARCHAR(20),
    estado        VARCHAR(10)  NOT NULL DEFAULT 'Activo',
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id) REFERENCES rol(rol_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_usuario_estado
        CHECK (estado IN ('Activo','Inactivo')),
    CONSTRAINT chk_usuario_email
        CHECK (email LIKE '%@upa.edu.mx')
) ENGINE=InnoDB;

-- ---------- DOCENTE ----------
CREATE TABLE docente (
    docente_id   INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT NOT NULL UNIQUE,
    num_empleado VARCHAR(20) NOT NULL UNIQUE,
    departamento VARCHAR(100),
    CONSTRAINT fk_docente_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- GRUPO ----------
CREATE TABLE grupo (
    grupo_id   INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    carrera_id INT NOT NULL,
    nombre     VARCHAR(30) NOT NULL,
    semestre   INT NOT NULL,
    CONSTRAINT fk_grupo_docente
        FOREIGN KEY (docente_id) REFERENCES docente(docente_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_grupo_carrera
        FOREIGN KEY (carrera_id) REFERENCES carrera(carrera_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_grupo_semestre CHECK (semestre BETWEEN 1 AND 12)
) ENGINE=InnoDB;

-- ---------- ESTUDIANTE ----------
CREATE TABLE estudiante (
    estudiante_id    INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT NOT NULL UNIQUE,
    carrera_id       INT NOT NULL,
    grupo_id         INT,
    matricula        VARCHAR(20) NOT NULL UNIQUE,
    semestre         INT,
    direccion        VARCHAR(200),
    fecha_nacimiento DATE,
    CONSTRAINT fk_estudiante_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_estudiante_carrera
        FOREIGN KEY (carrera_id) REFERENCES carrera(carrera_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_estudiante_grupo
        FOREIGN KEY (grupo_id) REFERENCES grupo(grupo_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_estudiante_semestre CHECK (semestre BETWEEN 1 AND 12)
) ENGINE=InnoDB;

-- =============================================================================
--  3. ESPACIOS Y TABLAS PIVOTE M:N
-- =============================================================================

-- ---------- EDIFICIO_TIPO_ESPACIO  (pivote M:N) ----------
CREATE TABLE edificio_tipo_espacio (
    edificio_id    INT NOT NULL,
    tipo_id        INT NOT NULL,
    cantidad_total INT NOT NULL DEFAULT 0,
    PRIMARY KEY (edificio_id, tipo_id),
    CONSTRAINT fk_ete_edificio
        FOREIGN KEY (edificio_id) REFERENCES edificio(edificio_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ete_tipo
        FOREIGN KEY (tipo_id) REFERENCES tipo_espacio(tipo_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_ete_cantidad CHECK (cantidad_total >= 0)
) ENGINE=InnoDB;

-- ---------- ROL_TIPO_ESPACIO  (pivote M:N) ----------
CREATE TABLE rol_tipo_espacio (
    rol_id  INT NOT NULL,
    tipo_id INT NOT NULL,
    PRIMARY KEY (rol_id, tipo_id),
    CONSTRAINT fk_rte_rol
        FOREIGN KEY (rol_id) REFERENCES rol(rol_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rte_tipo
        FOREIGN KEY (tipo_id) REFERENCES tipo_espacio(tipo_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- ESPACIO ----------
CREATE TABLE espacio (
    espacio_id  INT AUTO_INCREMENT PRIMARY KEY,
    tipo_id     INT NOT NULL,
    edificio_id INT NOT NULL,
    nombre      VARCHAR(60) NOT NULL,
    capacidad   INT NOT NULL DEFAULT 1,
    estado      VARCHAR(15) NOT NULL DEFAULT 'Disponible',
    CONSTRAINT fk_espacio_tipo
        FOREIGN KEY (tipo_id) REFERENCES tipo_espacio(tipo_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_espacio_edificio
        FOREIGN KEY (edificio_id) REFERENCES edificio(edificio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_espacio_nombre UNIQUE (edificio_id, nombre),
    CONSTRAINT chk_espacio_estado
        CHECK (estado IN ('Disponible','Ocupado','Bloqueado','Mantenimiento'))
) ENGINE=InnoDB;

-- =============================================================================
--  4. RESERVAS, BLOQUEOS, HISTORIAL Y NOTIFICACIONES
-- =============================================================================

-- ---------- RESERVA ----------
CREATE TABLE reserva (
    reserva_id     INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id     INT NOT NULL,
    espacio_id     INT NOT NULL,
    estado_id      INT NOT NULL,
    titulo         VARCHAR(120) NOT NULL,
    fecha_reserva  DATE NOT NULL,
    hora_inicio    TIME NOT NULL,
    hora_fin       TIME NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones  VARCHAR(255),
    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_espacio
        FOREIGN KEY (espacio_id) REFERENCES espacio(espacio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_estado
        FOREIGN KEY (estado_id) REFERENCES estado_reserva(estado_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    -- Regla 6: rango horario permitido 07:00–20:00
    CONSTRAINT chk_reserva_horario
        CHECK (hora_inicio >= '07:00:00'
           AND hora_fin   <= '20:00:00'
           AND hora_inicio <  hora_fin)
) ENGINE=InnoDB;

CREATE INDEX idx_reserva_espacio_fecha ON reserva (espacio_id, fecha_reserva);

-- ---------- BLOQUEO_ESPACIO ----------
CREATE TABLE bloqueo_espacio (
    bloqueo_id   INT AUTO_INCREMENT PRIMARY KEY,
    espacio_id   INT NOT NULL,
    admin_id     INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin    DATETIME NOT NULL,
    motivo       VARCHAR(150) NOT NULL,
    CONSTRAINT fk_bloqueo_espacio
        FOREIGN KEY (espacio_id) REFERENCES espacio(espacio_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_bloqueo_admin
        FOREIGN KEY (admin_id) REFERENCES usuario(usuario_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_bloqueo_rango CHECK (fecha_inicio < fecha_fin)
) ENGINE=InnoDB;

-- ---------- HISTORIAL_RESERVA ----------
CREATE TABLE historial_reserva (
    historial_id      INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id        INT NOT NULL,
    usuario_gestor_id INT NOT NULL,
    accion            VARCHAR(20) NOT NULL,
    fecha_accion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario        VARCHAR(255),
    CONSTRAINT fk_historial_reserva
        FOREIGN KEY (reserva_id) REFERENCES reserva(reserva_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_historial_gestor
        FOREIGN KEY (usuario_gestor_id) REFERENCES usuario(usuario_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_historial_accion
        CHECK (accion IN ('Aprobada','Rechazada','Cancelada','Modificada'))
) ENGINE=InnoDB;

-- ---------- NOTIFICACION ----------
CREATE TABLE notificacion (
    notificacion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT NOT NULL,
    titulo          VARCHAR(120) NOT NULL,
    mensaje         TEXT NOT NULL,
    leida           BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_envio     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
--  5. DATOS DE EJEMPLO (SEED)
-- =============================================================================

-- ---------- ROL ----------
INSERT INTO rol (nombre_rol) VALUES
    ('Estudiante'),        -- 1
    ('Docente'),           -- 2
    ('Admin Biblioteca'),  -- 3
    ('Admin General');     -- 4

-- ---------- CARRERA ----------
INSERT INTO carrera (nombre, codigo) VALUES
    ('Ingeniería en Sistemas Computacionales', 'ISC'),  -- 1
    ('Ingeniería Industrial',                  'IIND'), -- 2
    ('Ingeniería en Robótica',                 'IROB'); -- 3

-- ---------- EDIFICIO ----------
INSERT INTO edificio (nombre, codigo, ubicacion, descripcion) VALUES
    ('Biblioteca', 'E5', 'Zona central',  'Biblioteca central y cubículos de estudio'), -- 1
    ('Edificio A', 'EA', 'Ala norte',     'Auditorios y laboratorios de cómputo'),      -- 2
    ('Edificio B', 'EB', 'Ala sur',       'Laboratorios y salas de reuniones');         -- 3

-- ---------- TIPO_ESPACIO ----------
INSERT INTO tipo_espacio (nombre_tipo, descripcion, capacidad_default) VALUES
    ('Cubículo',         'Espacio pequeño de estudio individual o en grupo', 6),  -- 1
    ('Auditorio',        'Espacio grande para eventos y conferencias',       200),-- 2
    ('Laboratorio',      'Laboratorio de cómputo o especializado',           30), -- 3
    ('Sala de Reuniones','Sala para reuniones de trabajo',                    12); -- 4

-- ---------- ESTADO_RESERVA ----------
INSERT INTO estado_reserva (nombre_estado) VALUES
    ('Pendiente'),   -- 1
    ('Confirmada'),  -- 2
    ('Completada'),  -- 3
    ('Cancelada');   -- 4

-- ---------- EDIFICIO_TIPO_ESPACIO (M:N) ----------
INSERT INTO edificio_tipo_espacio (edificio_id, tipo_id, cantidad_total) VALUES
    (1, 1, 50),  -- Biblioteca  -> Cubículo   (50)
    (2, 2, 2),   -- Edificio A  -> Auditorio  (2)
    (2, 3, 8),   -- Edificio A  -> Laboratorio(8)
    (3, 3, 5),   -- Edificio B  -> Laboratorio(5)
    (3, 4, 4);   -- Edificio B  -> Sala Reun. (4)

-- ---------- ROL_TIPO_ESPACIO (M:N) ----------
INSERT INTO rol_tipo_espacio (rol_id, tipo_id) VALUES
    (1, 1),                          -- Estudiante -> Cubículo
    (2, 1), (2, 2), (2, 3), (2, 4),  -- Docente -> todos
    (3, 1),                          -- Admin Biblioteca -> Cubículo
    (4, 1), (4, 2), (4, 3), (4, 4);  -- Admin General -> todos

-- ---------- USUARIO ----------
-- password_hash es un ejemplo (hash bcrypt ficticio)
INSERT INTO usuario (rol_id, nombre, apellido, email, password_hash, telefono, estado) VALUES
    (1, 'Ana',    'García',  'ana.garcia@upa.edu.mx',   '$2y$10$ejemploHashEstudiante1', '5551000001', 'Activo'), -- 1 estudiante
    (1, 'Luis',   'Pérez',   'luis.perez@upa.edu.mx',   '$2y$10$ejemploHashEstudiante2', '5551000002', 'Activo'), -- 2 estudiante
    (2, 'María',  'López',   'maria.lopez@upa.edu.mx',  '$2y$10$ejemploHashDocente1',    '5551000003', 'Activo'), -- 3 docente
    (2, 'Jorge',  'Ramírez', 'jorge.ramirez@upa.edu.mx','$2y$10$ejemploHashDocente2',    '5551000004', 'Activo'), -- 4 docente
    (3, 'Sofía',  'Hernández','sofia.hernandez@upa.edu.mx','$2y$10$ejemploHashAdminBib',  '5551000005', 'Activo'), -- 5 admin biblioteca
    (4, 'Carlos', 'Méndez',  'carlos.mendez@upa.edu.mx','$2y$10$ejemploHashAdminGral',   '5551000006', 'Activo'); -- 6 admin general

-- ---------- DOCENTE ----------
INSERT INTO docente (usuario_id, num_empleado, departamento) VALUES
    (3, 'EMP-1001', 'Ciencias Computacionales'), -- docente_id 1 (usuario 3)
    (4, 'EMP-1002', 'Robótica');                 -- docente_id 2 (usuario 4)

-- ---------- GRUPO ----------
INSERT INTO grupo (docente_id, carrera_id, nombre, semestre) VALUES
    (1, 1, 'ISC-601',  6),  -- 1
    (2, 3, 'IROB-401', 4);  -- 2

-- ---------- ESTUDIANTE ----------
INSERT INTO estudiante (usuario_id, carrera_id, grupo_id, matricula, semestre, direccion, fecha_nacimiento) VALUES
    (1, 1, 1, '2021030001', 6, 'Calle Falsa 123',  '2003-05-14'),
    (2, 3, 2, '2022030045', 4, 'Av. Central 456',   '2004-09-30');

-- ---------- ESPACIO ----------
INSERT INTO espacio (tipo_id, edificio_id, nombre, capacidad, estado) VALUES
    (1, 1, 'E5-101',            6,   'Disponible'),  -- 1 cubículo
    (1, 1, 'E5-102',            6,   'Disponible'),  -- 2 cubículo
    (1, 1, 'E5-204',            4,   'Disponible'),  -- 3 cubículo
    (2, 2, 'Auditorio Principal',200,'Disponible'),  -- 4 auditorio
    (3, 2, 'EA-Lab1',           30,  'Disponible'),  -- 5 laboratorio
    (3, 3, 'EB-Lab3',           25,  'Disponible'),  -- 6 laboratorio
    (4, 3, 'EB-Sala2',          12,  'Disponible');  -- 7 sala de reuniones

-- ---------- RESERVA ----------
INSERT INTO reserva (usuario_id, espacio_id, estado_id, titulo, fecha_reserva, hora_inicio, hora_fin, observaciones) VALUES
    (1, 1, 2, 'Estudio',              '2026-07-13', '09:00:00', '11:00:00', 'Sesión de estudio individual'), -- estudiante en cubículo
    (3, 4, 1, 'Cálculo I',            '2026-07-14', '12:00:00', '14:00:00', 'Clase magistral'),             -- docente en auditorio
    (4, 6, 2, 'Reunión de robótica',  '2026-07-15', '16:00:00', '18:00:00', 'Prueba de prototipos');       -- docente en laboratorio

-- ---------- BLOQUEO_ESPACIO ----------
INSERT INTO bloqueo_espacio (espacio_id, admin_id, fecha_inicio, fecha_fin, motivo) VALUES
    (5, 6, '2026-07-16 07:00:00', '2026-07-16 20:00:00', 'Mantenimiento'),        -- admin general bloquea laboratorio
    (4, 5, '2026-07-20 08:00:00', '2026-07-20 14:00:00', 'Evento institucional'); -- admin biblioteca (ejemplo)

-- ---------- HISTORIAL_RESERVA ----------
INSERT INTO historial_reserva (reserva_id, usuario_gestor_id, accion, comentario) VALUES
    (1, 5, 'Aprobada', 'Aprobada por Admin Biblioteca (cubículo)'),
    (2, 6, 'Aprobada', 'Aprobada por Admin General (auditorio)'),
    (3, 6, 'Aprobada', 'Aprobada por Admin General (laboratorio)');

-- ---------- NOTIFICACION ----------
INSERT INTO notificacion (usuario_id, titulo, mensaje, leida) VALUES
    (1, 'Reserva confirmada', 'Tu reserva del cubículo E5-101 fue confirmada.', FALSE),
    (3, 'Reserva pendiente',  'Tu reserva del Auditorio Principal está pendiente de aprobación.', FALSE),
    (4, 'Reserva confirmada', 'Tu reserva del laboratorio EB-Lab3 fue confirmada.', TRUE);

-- =============================================================================
--  6. VISTAS DE APOYO (opcionales, facilitan consultas y reglas de negocio)
-- =============================================================================

-- Permisos rol/tipo (regla 1): qué puede reservar cada usuario
CREATE OR REPLACE VIEW v_permisos_usuario AS
SELECT u.usuario_id, u.nombre, u.apellido, r.nombre_rol,
       te.tipo_id, te.nombre_tipo
FROM usuario u
JOIN rol r               ON r.rol_id  = u.rol_id
JOIN rol_tipo_espacio rte ON rte.rol_id = r.rol_id
JOIN tipo_espacio te     ON te.tipo_id = rte.tipo_id;

-- Reservas con toda su información legible
CREATE OR REPLACE VIEW v_reservas_detalle AS
SELECT rv.reserva_id,
       CONCAT(u.nombre,' ',u.apellido) AS solicitante,
       r.nombre_rol,
       e.nombre  AS espacio,
       te.nombre_tipo,
       ed.nombre AS edificio,
       er.nombre_estado AS estado,
       rv.titulo, rv.fecha_reserva, rv.hora_inicio, rv.hora_fin
FROM reserva rv
JOIN usuario u        ON u.usuario_id = rv.usuario_id
JOIN rol r            ON r.rol_id     = u.rol_id
JOIN espacio e        ON e.espacio_id = rv.espacio_id
JOIN tipo_espacio te  ON te.tipo_id   = e.tipo_id
JOIN edificio ed      ON ed.edificio_id = e.edificio_id
JOIN estado_reserva er ON er.estado_id = rv.estado_id;

-- =============================================================================
--  7. TRIGGERS DE REGLAS DE NEGOCIO
-- =============================================================================
DELIMITER $$

-- ---- Regla 1: el rol del usuario debe poder reservar el tipo del espacio ----
-- ---- Regla 2: sin traslape con otra reserva activa (Pendiente/Confirmada) ---
-- ---- Regla 3: sin traslape con un bloqueo del mismo espacio -----------------
CREATE TRIGGER trg_reserva_before_insert
BEFORE INSERT ON reserva
FOR EACH ROW
BEGIN
    DECLARE v_rol_id     INT;
    DECLARE v_tipo_id    INT;
    DECLARE v_permiso    INT;
    DECLARE v_traslape   INT;
    DECLARE v_bloqueo    INT;

    -- Rol del usuario que reserva
    SELECT rol_id INTO v_rol_id FROM usuario WHERE usuario_id = NEW.usuario_id;
    -- Tipo del espacio solicitado
    SELECT tipo_id INTO v_tipo_id FROM espacio WHERE espacio_id = NEW.espacio_id;

    -- Regla 1: permiso rol-tipo
    SELECT COUNT(*) INTO v_permiso
    FROM rol_tipo_espacio
    WHERE rol_id = v_rol_id AND tipo_id = v_tipo_id;
    IF v_permiso = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Regla 1: el rol del usuario no puede reservar este tipo de espacio.';
    END IF;

    -- Regla 2: traslape con reserva activa (Pendiente=1 / Confirmada=2)
    SELECT COUNT(*) INTO v_traslape
    FROM reserva r
    JOIN estado_reserva er ON er.estado_id = r.estado_id
    WHERE r.espacio_id = NEW.espacio_id
      AND r.fecha_reserva = NEW.fecha_reserva
      AND er.nombre_estado IN ('Pendiente','Confirmada')
      AND NEW.hora_inicio < r.hora_fin
      AND NEW.hora_fin    > r.hora_inicio;
    IF v_traslape > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Regla 2: ya existe una reserva activa que se traslapa con ese horario.';
    END IF;

    -- Regla 3: traslape con un bloqueo del espacio
    SELECT COUNT(*) INTO v_bloqueo
    FROM bloqueo_espacio b
    WHERE b.espacio_id = NEW.espacio_id
      AND b.fecha_inicio < TIMESTAMP(NEW.fecha_reserva, NEW.hora_fin)
      AND b.fecha_fin    > TIMESTAMP(NEW.fecha_reserva, NEW.hora_inicio);
    IF v_bloqueo > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Regla 3: el espacio está bloqueado en ese horario.';
    END IF;
END$$

-- ---- Regla 7: al crear un bloqueo el espacio pasa a 'Bloqueado' -------------
CREATE TRIGGER trg_bloqueo_after_insert
AFTER INSERT ON bloqueo_espacio
FOR EACH ROW
BEGIN
    UPDATE espacio
    SET estado = 'Bloqueado'
    WHERE espacio_id = NEW.espacio_id;
END$$

DELIMITER ;

-- =============================================================================
--  FIN DEL SCRIPT
-- =============================================================================