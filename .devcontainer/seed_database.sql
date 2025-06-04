--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.8 (Debian 16.8-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: your_username
--

CREATE TABLE public.bookmarks (
    id integer,
    link character varying(1000),
    created_at timestamp without time zone,
    deleted_at timestamp without time zone,
    ip_address character varying(45),
    title character varying(255)
);


ALTER TABLE public.bookmarks OWNER TO "your_username";

--
-- PostgreSQL database dump complete
--

