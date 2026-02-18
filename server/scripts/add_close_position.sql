-- Migration: add close position tracking to holdings table
-- Run this once in MySQL Workbench or CLI

USE alphasigma;

ALTER TABLE holdings
  ADD COLUMN close_price DECIMAL(10, 4) NULL,
  ADD COLUMN closed_at   TIMESTAMP NULL DEFAULT NULL;
