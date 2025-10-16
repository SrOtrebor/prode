-- PostgreSQL final schema for fulbitoplay

-- Drop tables in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS unlocked_score_bets;
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS activation_keys;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'player'::character varying NOT NULL,
    key_balance integer DEFAULT 0 NOT NULL, -- Added
    created_at timestamp with time zone DEFAULT now()
);

-- Create sequences for auto-incrementing IDs
CREATE SEQUENCE public.users_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    user_id integer REFERENCES public.users(id) ON DELETE CASCADE,
    message_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.chat_messages_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;
ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);

-- Create activation_keys table
CREATE TABLE public.activation_keys (
    id integer NOT NULL,
    key_code character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    quantity integer DEFAULT 1, -- Added
    used_by_user_id integer REFERENCES public.users(id),
    used_at timestamp with time zone
);
CREATE SEQUENCE public.activation_keys_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.activation_keys_id_seq OWNED BY public.activation_keys.id;
ALTER TABLE ONLY public.activation_keys ALTER COLUMN id SET DEFAULT nextval('public.activation_keys_id_seq'::regclass);

-- Create events table
CREATE TABLE public.events (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    close_date timestamp with time zone NOT NULL
);
CREATE SEQUENCE public.events_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;
ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);

-- Create matches table
CREATE TABLE public.matches (
    id integer NOT NULL,
    event_id integer REFERENCES public.events(id) ON DELETE CASCADE,
    local_team character varying(100) NOT NULL,
    visitor_team character varying(100) NOT NULL,
    match_date timestamp with time zone NOT NULL,
    result_local integer,
    result_visitor integer
);
CREATE SEQUENCE public.matches_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;
ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);

-- Create predictions table
CREATE TABLE public.predictions (
    id integer NOT NULL,
    user_id integer REFERENCES public.users(id) ON DELETE CASCADE,
    match_id integer REFERENCES public.matches(id) ON DELETE CASCADE,
    prediction_main character varying(1) NOT NULL,
    predicted_score_local integer,
    predicted_score_visitor integer,
    points_obtained integer
);
CREATE SEQUENCE public.predictions_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.predictions_id_seq OWNED BY public.predictions.id;
ALTER TABLE ONLY public.predictions ALTER COLUMN id SET DEFAULT nextval('public.predictions_id_seq'::regclass);

-- Create unlocked_score_bets table
CREATE TABLE public.unlocked_score_bets (
    id integer NOT NULL,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id integer NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);
CREATE SEQUENCE public.unlocked_score_bets_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.unlocked_score_bets_id_seq OWNED BY public.unlocked_score_bets.id;
ALTER TABLE ONLY public.unlocked_score_bets ALTER COLUMN id SET DEFAULT nextval('public.unlocked_score_bets_id_seq'::regclass);

-- Add constraints
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE ONLY public.chat_messages ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activation_keys ADD CONSTRAINT activation_keys_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activation_keys ADD CONSTRAINT activation_keys_key_code_key UNIQUE (key_code);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.matches ADD CONSTRAINT matches_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.predictions ADD CONSTRAINT predictions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.predictions ADD CONSTRAINT predictions_user_id_match_id_key UNIQUE (user_id, match_id);
ALTER TABLE ONLY public.unlocked_score_bets ADD CONSTRAINT unlocked_score_bets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.unlocked_score_bets ADD CONSTRAINT unlocked_score_bets_user_id_match_id_key UNIQUE (user_id, match_id);

