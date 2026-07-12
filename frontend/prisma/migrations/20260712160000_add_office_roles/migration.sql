-- Add office roles used when admins create accounts
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BudgetOffice';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GovernorOffice';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ProvincialAdministrator';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RecordOffice';
