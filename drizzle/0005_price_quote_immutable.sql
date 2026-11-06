-- price_quote is an append-only history of live prices: rows can be inserted
-- but never changed or removed, whoever is connected.
CREATE OR REPLACE FUNCTION price_quote_immutable() RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'price_quote rows are immutable (% is not allowed)', TG_OP
		USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER price_quote_no_update_delete
	BEFORE UPDATE OR DELETE ON "price_quote"
	FOR EACH ROW EXECUTE FUNCTION price_quote_immutable();
--> statement-breakpoint
CREATE TRIGGER price_quote_no_truncate
	BEFORE TRUNCATE ON "price_quote"
	FOR EACH STATEMENT EXECUTE FUNCTION price_quote_immutable();
