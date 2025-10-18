-- PostgreSQL final schema for fulbitoplay (v2, corrected order)

-- Drop tables in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS vip_statuses;
DROP TABLE IF EXISTS unlocked_score_bets;
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS activation_keys;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS users;

-- Create tables with constraints included

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email character varying(255) NOT NULL UNIQUE,
    username character varying(50) NOT NULL UNIQUE,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'player'::character varying NOT NULL,
    key_balance integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT false NOT NULL,
    is_muted boolean DEFAULT false NOT NULL
);

CREATE TABLE public.chat_messages (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.activation_keys (
    id SERIAL PRIMARY KEY,
    key_code character varying(100) NOT NULL UNIQUE,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    quantity integer DEFAULT 1,
    used_by_user_id integer REFERENCES public.users(id) ON DELETE SET NULL,
    used_at timestamp with time zone
);

CREATE TABLE public.events (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    close_date timestamp with time zone NOT NULL
);

CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY,
    event_id integer REFERENCES public.events(id) ON DELETE CASCADE,
    local_team character varying(100) NOT NULL,
    visitor_team character varying(100) NOT NULL,
    match_datetime timestamp with time zone NOT NULL,
    result_local integer,
    result_visitor integer
);

CREATE TABLE public.predictions (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    prediction_main character varying(1) NOT NULL,
    predicted_score_local integer,
    predicted_score_visitor integer,
    points_obtained integer,
    UNIQUE(user_id, match_id)
);

CREATE TABLE public.unlocked_score_bets (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, match_id)
);

CREATE TABLE public.vip_statuses (
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id integer NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);
