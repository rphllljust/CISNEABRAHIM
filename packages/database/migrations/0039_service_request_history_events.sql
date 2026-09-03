CREATE TABLE "sr"."service_request_history_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "service_request_history_events_event_type_not_empty_chk" CHECK (length(trim("sr"."service_request_history_events"."event_type")) > 0)
);
--> statement-breakpoint
CREATE INDEX "service_request_history_events_service_request_id_idx" ON "sr"."service_request_history_events" USING btree ("service_request_id");
--> statement-breakpoint
ALTER TABLE "sr"."service_request_history_events" ADD CONSTRAINT "service_request_history_events_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "sr"."service_requests"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_request_history_events" ADD CONSTRAINT "service_request_history_events_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;