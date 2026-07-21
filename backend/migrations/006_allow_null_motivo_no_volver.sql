-- Allow motivo_no_volver to be NULL (it should only be filled when user doesn't want revisit)
ALTER TABLE casas ALTER COLUMN motivo_no_volver DROP NOT NULL;
