-- Adicionar tipo 'phone_system' ao enum integration_type
ALTER TYPE integration_type ADD VALUE IF NOT EXISTS 'phone_system';