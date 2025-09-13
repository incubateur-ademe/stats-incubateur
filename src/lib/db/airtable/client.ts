import { type Base, default as Airtable, type FieldSet, type Table } from "@lsagetlethias/node-airtable";

import { config } from "@/config";

import { type AirtableSchema_Budget } from "./types";

interface PVLivraison extends AirtableSchema_Budget.Table_PV_Livraison, FieldSet {}

export interface BaseMapping {
  budget: {
    "PV Livraison": PVLivraison;
    Startup: AirtableSchema_Budget.Table_Startup;
  };
}

export interface CustomBase<TBaseName extends keyof BaseMapping> extends Omit<Base, "table"> {
  table<
    TBase extends BaseMapping[TBaseName],
    TTableName extends keyof TBase,
    TFieldSet extends TBase[TTableName] extends FieldSet ? TBase[TTableName] : FieldSet,
  >(
    tableName: TTableName,
  ): Table<TFieldSet>;
}

export interface CustomAirtable extends Omit<Airtable, "base"> {
  base<TBaseName extends keyof BaseMapping>(baseId: string): CustomBase<TBaseName>;
}

export const airtable = new Airtable({
  apiKey: config.airtable.apiKey,
  fetch,
}) as CustomAirtable;

export const budgetBase = airtable.base<"budget">(config.airtable.baseId);
export const pvLivraisonTable = budgetBase.table("PV Livraison");
export const startupTable = budgetBase.table("Startup");
