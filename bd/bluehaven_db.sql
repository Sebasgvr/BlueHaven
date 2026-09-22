-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-09-2026 a las 20:47:07
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bluehaven_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `capturas_usuario`
--

CREATE TABLE `capturas_usuario` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `pez_id` int(11) NOT NULL,
  `cantidad_capturada` int(11) DEFAULT 1,
  `primera_captura` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_objetos`
--

CREATE TABLE `inventario_objetos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `objeto_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_peces`
--

CREATE TABLE `inventario_peces` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `pez_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `objetos`
--

CREATE TABLE `objetos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `precio` int(11) DEFAULT 0,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `peces`
--

CREATE TABLE `peces` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rareza` int(11) NOT NULL,
  `velocidad` float DEFAULT NULL,
  `sprite` varchar(150) DEFAULT NULL,
  `habitat` varchar(150) DEFAULT NULL,
  `anzuelo_recomendado` varchar(100) DEFAULT NULL,
  `linea_recomendada` varchar(100) DEFAULT NULL,
  `cebo_recomendado` varchar(100) DEFAULT NULL,
  `tamaño_cm` float DEFAULT NULL,
  `peso_kg` float DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `peces`
--

INSERT INTO `peces` (`id`, `nombre`, `rareza`, `velocidad`, `sprite`, `habitat`, `anzuelo_recomendado`, `linea_recomendada`, `cebo_recomendado`, `tamaño_cm`, `peso_kg`, `descripcion`) VALUES
(1, 'Carpa', 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'Trucha Arcoíris', 2, 1.8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Atún', 2, 2.3, 'Atun.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Calamar', 3, 3.1, 'Calamar.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Dragón del Lago', 3, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Esturión Gigante', 4, 3.6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'Ballena Azul', 4, 4, 'Ballena_azul.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Pez Remo', 5, 4.2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `dinero` int(11) DEFAULT 0,
  `creado_en` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `capturas_usuario`
--
ALTER TABLE `capturas_usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unico_usuario_pez` (`usuario_id`,`pez_id`),
  ADD KEY `pez_id` (`pez_id`);

--
-- Indices de la tabla `inventario_objetos`
--
ALTER TABLE `inventario_objetos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `objeto_id` (`objeto_id`);

--
-- Indices de la tabla `inventario_peces`
--
ALTER TABLE `inventario_peces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `pez_id` (`pez_id`);

--
-- Indices de la tabla `objetos`
--
ALTER TABLE `objetos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `peces`
--
ALTER TABLE `peces`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `capturas_usuario`
--
ALTER TABLE `capturas_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inventario_objetos`
--
ALTER TABLE `inventario_objetos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inventario_peces`
--
ALTER TABLE `inventario_peces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `objetos`
--
ALTER TABLE `objetos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `peces`
--
ALTER TABLE `peces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `capturas_usuario`
--
ALTER TABLE `capturas_usuario`
  ADD CONSTRAINT `capturas_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capturas_usuario_ibfk_2` FOREIGN KEY (`pez_id`) REFERENCES `peces` (`id`);

--
-- Filtros para la tabla `inventario_objetos`
--
ALTER TABLE `inventario_objetos`
  ADD CONSTRAINT `inventario_objetos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventario_objetos_ibfk_2` FOREIGN KEY (`objeto_id`) REFERENCES `objetos` (`id`);

--
-- Filtros para la tabla `inventario_peces`
--
ALTER TABLE `inventario_peces`
  ADD CONSTRAINT `inventario_peces_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventario_peces_ibfk_2` FOREIGN KEY (`pez_id`) REFERENCES `peces` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
