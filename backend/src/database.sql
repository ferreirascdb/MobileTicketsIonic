CREATE DATABASE atendimento_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE atendimento_lab;

CREATE TABLE guiches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL UNIQUE,
    tipo ENUM('SP', 'SG', 'SE') NOT NULL,
    status ENUM(
        'EMITIDA',
        'CHAMADA',
        'EM_ATENDIMENTO',
        'ATENDIDA',
        'DESCARTADA',
        'NAO_COMPARECEU'
    ) DEFAULT 'EMITIDA',
    data_emissao DATETIME NOT NULL,
    data_chamada DATETIME NULL,
    data_inicio_atendimento DATETIME NULL,
    data_fim_atendimento DATETIME NULL,
    guiche_id INT NULL,
    tempo_atendimento_segundos INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (guiche_id) REFERENCES guiches(id)
);

CREATE TABLE daily_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_referencia DATE NOT NULL,
    tipo ENUM('SP', 'SG', 'SE') NOT NULL,
    sequencia_atual INT NOT NULL DEFAULT 0,
    UNIQUE KEY unique_data_tipo (data_referencia, tipo)
);

CREATE TABLE system_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_referencia DATE NOT NULL UNIQUE,
    ultimo_tipo_chamado ENUM('SP', 'SG', 'SE') NULL,
    expediente_aberto BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO guiches (nome) VALUES 
('Guichê 01'),
('Guichê 02'),
('Guichê 03');
