--
-- PostgreSQL database dump
--

\restrict AzGnAbcvpukfahFvSVBE9yRDkO0YYmtqvVIIgucNZ46rXPO2tioeU2p0g0wfO9B

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-25 00:19:35

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16446)
-- Name: activation_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activation_keys (
    id integer NOT NULL,
    key_code character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    used_by_user_id integer,
    used_at timestamp with time zone
);


ALTER TABLE public.activation_keys OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16445)
-- Name: activation_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activation_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activation_keys_id_seq OWNER TO postgres;

--
-- TOC entry 4920 (class 0 OID 0)
-- Dependencies: 225
-- Name: activation_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activation_keys_id_seq OWNED BY public.activation_keys.id;


--
-- TOC entry 228 (class 1259 OID 16461)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    user_id integer,
    message_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16460)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- TOC entry 4921 (class 0 OID 0)
-- Dependencies: 227
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 220 (class 1259 OID 16407)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    close_date timestamp with time zone NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16406)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- TOC entry 4922 (class 0 OID 0)
-- Dependencies: 219
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 222 (class 1259 OID 16415)
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    event_id integer,
    local_team character varying(100) NOT NULL,
    visitor_team character varying(100) NOT NULL,
    match_date timestamp with time zone NOT NULL,
    result_local integer,
    result_visitor integer
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16414)
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO postgres;

--
-- TOC entry 4923 (class 0 OID 0)
-- Dependencies: 221
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- TOC entry 224 (class 1259 OID 16427)
-- Name: predictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictions (
    id integer NOT NULL,
    user_id integer,
    match_id integer,
    prediction_main character varying(1) NOT NULL,
    predicted_score_local integer,
    predicted_score_visitor integer,
    points_obtained integer
);


ALTER TABLE public.predictions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16426)
-- Name: predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.predictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.predictions_id_seq OWNER TO postgres;

--
-- TOC entry 4924 (class 0 OID 0)
-- Dependencies: 223
-- Name: predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.predictions_id_seq OWNED BY public.predictions.id;


--
-- TOC entry 218 (class 1259 OID 16390)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'standard'::character varying NOT NULL,
    team_crest character varying(255),
    total_points integer DEFAULT 0 NOT NULL,
    current_badge character varying(50) DEFAULT 'Novato'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4925 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4729 (class 2604 OID 16449)
-- Name: activation_keys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_keys ALTER COLUMN id SET DEFAULT nextval('public.activation_keys_id_seq'::regclass);


--
-- TOC entry 4731 (class 2604 OID 16464)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4725 (class 2604 OID 16410)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 4727 (class 2604 OID 16418)
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- TOC entry 4728 (class 2604 OID 16430)
-- Name: predictions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions ALTER COLUMN id SET DEFAULT nextval('public.predictions_id_seq'::regclass);


--
-- TOC entry 4720 (class 2604 OID 16393)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4912 (class 0 OID 16446)
-- Dependencies: 226
-- Data for Name: activation_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activation_keys (id, key_code, status, used_by_user_id, used_at) FROM stdin;
\.


--
-- TOC entry 4914 (class 0 OID 16461)
-- Dependencies: 228
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, user_id, message_content, created_at) FROM stdin;
1	1	¡Buenas! ¿Listos para la fecha?	2025-08-24 16:13:18.948182-03
2	2	¡Nací listo! Vamos que la pego toda esta semana.	2025-08-24 16:13:18.948182-03
3	3	¡Hola a todos! Probando el envío de mensajes.	2025-08-24 16:28:28.386274-03
4	2	hola como estan ?	2025-08-24 16:43:01.96231-03
5	2	esta es una muestra para Ernesto que esta medio trolazo	2025-08-24 16:47:00.094574-03
6	1	Parece que bastante trolazo	2025-08-24 16:47:32.737087-03
\.


--
-- TOC entry 4906 (class 0 OID 16407)
-- Dependencies: 220
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, name, status, close_date) FROM stdin;
1	Fecha 1 - Liga Profesional	open	2025-08-29 20:00:00-03
\.


--
-- TOC entry 4908 (class 0 OID 16415)
-- Dependencies: 222
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (id, event_id, local_team, visitor_team, match_date, result_local, result_visitor) FROM stdin;
1	1	River Plate	Boca Juniors	2025-08-31 17:00:00-03	\N	\N
2	1	Racing Club	Independiente	2025-08-30 21:00:00-03	\N	\N
3	1	San Lorenzo	Huracán	2025-08-30 19:00:00-03	\N	\N
4	1	Estudiantes (LP)	Gimnasia (LP)	2025-08-31 15:00:00-03	\N	\N
\.


--
-- TOC entry 4910 (class 0 OID 16427)
-- Dependencies: 224
-- Data for Name: predictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.predictions (id, user_id, match_id, prediction_main, predicted_score_local, predicted_score_visitor, points_obtained) FROM stdin;
1	2	1	E	\N	\N	\N
2	2	2	L	\N	\N	\N
3	2	3	E	\N	\N	\N
4	2	4	V	\N	\N	\N
\.


--
-- TOC entry 4904 (class 0 OID 16390)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, password_hash, role, team_crest, total_points, current_badge, created_at) FROM stdin;
1	test@ejemplo.com	tester	$2b$10$QDfap8wNbS9Y9YMNorPWUuXE4aM/9m9a0BldlBUAFKNIOouQFk.6m	standard	\N	0	Novato	2025-08-21 22:36:22.576657-03
2	nuevo@ejemplo.com	nuevo_usuario	$2b$10$Vewjhgmbes4B7GLJJgydRO0bkzbllpDePnw7TcyB7.SKO.ZmwKAgm	standard	\N	0	Novato	2025-08-24 12:27:59.76608-03
3	usuario.nuevo@ejemplo.com	nuevo_user	$2b$10$utA5pR01XHhaWpq02NqUAuhns1eL5YjBjsTA7V6vO/TKiTvhr12I2	standard	\N	0	Novato	2025-08-24 16:22:17.831019-03
\.


--
-- TOC entry 4926 (class 0 OID 0)
-- Dependencies: 225
-- Name: activation_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activation_keys_id_seq', 1, false);


--
-- TOC entry 4927 (class 0 OID 0)
-- Dependencies: 227
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 6, true);


--
-- TOC entry 4928 (class 0 OID 0)
-- Dependencies: 219
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 1, true);


--
-- TOC entry 4929 (class 0 OID 0)
-- Dependencies: 221
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matches_id_seq', 4, true);


--
-- TOC entry 4930 (class 0 OID 0)
-- Dependencies: 223
-- Name: predictions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.predictions_id_seq', 20, true);


--
-- TOC entry 4931 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 4748 (class 2606 OID 16454)
-- Name: activation_keys activation_keys_key_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_key_code_key UNIQUE (key_code);


--
-- TOC entry 4750 (class 2606 OID 16452)
-- Name: activation_keys activation_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 4752 (class 2606 OID 16469)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4740 (class 2606 OID 16413)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4742 (class 2606 OID 16420)
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- TOC entry 4744 (class 2606 OID 16432)
-- Name: predictions predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_pkey PRIMARY KEY (id);


--
-- TOC entry 4746 (class 2606 OID 16434)
-- Name: predictions predictions_user_id_match_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_user_id_match_id_key UNIQUE (user_id, match_id);


--
-- TOC entry 4734 (class 2606 OID 16403)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4736 (class 2606 OID 16401)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4738 (class 2606 OID 16405)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4756 (class 2606 OID 16455)
-- Name: activation_keys activation_keys_used_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_used_by_user_id_fkey FOREIGN KEY (used_by_user_id) REFERENCES public.users(id);


--
-- TOC entry 4757 (class 2606 OID 16470)
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4753 (class 2606 OID 16421)
-- Name: matches matches_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 4754 (class 2606 OID 16440)
-- Name: predictions predictions_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- TOC entry 4755 (class 2606 OID 16435)
-- Name: predictions predictions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-08-25 00:19:35

--
-- PostgreSQL database dump complete
--

\unrestrict AzGnAbcvpukfahFvSVBE9yRDkO0YYmtqvVIIgucNZ46rXPO2tioeU2p0g0wfO9B

