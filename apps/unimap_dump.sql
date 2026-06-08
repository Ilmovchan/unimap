--
-- PostgreSQL database dump
--

\restrict AabjCxXU0BsfFRDsVm0h2QDXTzjbTSHfZO9aN5Dtin2mkcSwwJtaHLUnuobx9JU

-- Dumped from database version 14.22 (Homebrew)
-- Dumped by pg_dump version 14.22 (Homebrew)

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
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


ALTER TABLE public."__EFMigrationsHistory" OWNER TO postgres;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid NOT NULL,
    username character varying(64) NOT NULL,
    email character varying(320) NOT NULL,
    password_hash character varying(500) NOT NULL,
    role character varying(64) DEFAULT 'admin'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT "CK_admins_role" CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location (
    id uuid NOT NULL,
    location_type_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    description text,
    address_json jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.location OWNER TO postgres;

--
-- Name: location_photo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_photo (
    id uuid NOT NULL,
    location_id uuid NOT NULL,
    image_url character varying(2000) NOT NULL,
    storage_key character varying(500) NOT NULL,
    alt_uk character varying(500),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.location_photo OWNER TO postgres;

--
-- Name: location_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_type (
    id uuid NOT NULL,
    code character varying(50) NOT NULL,
    title_uk character varying(100) NOT NULL,
    marker_key character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.location_type OWNER TO postgres;

--
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    id uuid NOT NULL,
    title character varying(300) NOT NULL,
    content text NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.news OWNER TO postgres;

--
-- Name: university_object; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.university_object (
    id uuid NOT NULL,
    location_id uuid NOT NULL,
    object_type_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    description character varying(4000),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.university_object OWNER TO postgres;

--
-- Name: university_object_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.university_object_type (
    id uuid NOT NULL,
    code character varying(50) NOT NULL,
    title_uk character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.university_object_type OWNER TO postgres;

--
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20260514091614_InitialLocationDepartmentModel	9.0.6
20260514141508_RemoveLocationTitleDescription	9.0.6
20260514145034_LocationUniversityObjectSchema	9.0.6
20260514160501_SyncSnapshotWithDomainModel	9.0.6
20260515102146_AddNewsTable	9.0.6
20260516190734_AddAdminsTable	9.0.6
20260516191136_AddAdminRoleColumn	9.0.6
20260516195621_AddAdminUsernameColumn	9.0.6
20260517092749_AddLocationPhotosTable	9.0.6
20260517093301_RestoreLocationTableIfMissing	9.0.6
20260517093540_EnsureLocationPhotoTableIfMissing	9.0.6
20260517094003_RemoveLocationImageUrlColumn	9.0.6
20260518122026_RemoveLocationPhotoIsMain	9.0.6
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, username, email, password_hash, role, created_at, updated_at, last_login_at) FROM stdin;
95104038-40dc-451a-8f88-196cc7dfd1e9	admin_test	admin@gmail.com	$2a$11$96SSZ/Hxj/AQqQrPDKH5Gendr5XZMdVZxqBqkKMAl9a18z5CrE32q	admin	2026-05-16 23:41:55.098664+03	2026-05-16 23:41:55.098664+03	\N
0ddf0037-7a63-4d8e-ba10-3afe142043f1	admin2	admin2@gmail.com	$2a$11$rJzkqyzpn2Z.MGOD4vx5euK/gjlmiu0Htp60fvJGqN5ag1ZeHilT.	admin	2026-05-16 23:48:53.028153+03	2026-05-16 23:48:53.028153+03	2026-05-17 00:46:48.940627+03
fc8fdba5-b1cd-4ea0-9ea7-0e960edbdb6d	illia_movchan	ilmo2004321@gmail.com	$2a$11$D8IeLaZ78OdBocjo0wIaGuMCLqM7qDjoj5Fg2M4APhwUplWlsnW/C	super_admin	2026-05-17 01:59:37.532+03	2026-05-16 23:40:23.788911+03	2026-05-19 11:23:24.47521+03
\.


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location (id, location_type_id, title, latitude, longitude, description, address_json, created_at, updated_at) FROM stdin;
719a7425-268f-445a-af98-e881f3a91aa3	3843e5b8-d92c-48e5-94da-732a473a92bd	Одеський фаховий коледж комп'ютерних технологій ОНУ ім. І. І. Мечникова	46.41416656978314	30.722696098263423	\N	{"lat": "46.4139769", "lon": "30.7232906", "name": "", "type": "college", "osm_id": 160413699, "address": {"city": "Одеса", "road": "вулиця Академіка Корольова", "state": "Одеська область", "suburb": "Район IV-4 \\"Таїровський\\"", "borough": "Київський район", "country": "Україна", "district": "Одеський район", "postcode": "65101", "country_code": "ua", "house_number": "5/2", "municipality": "Одеська міська громада", "neighbourhood": "Мікрорайон \\"А-Б\\"", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 61873760, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4134123", "46.4145433", "30.7216287", "30.7237180"], "display_name": "5/2, вулиця Академіка Корольова, Мікрорайон \\"А-Б\\", Район IV-4 \\"Таїровський\\", Київський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65101, Україна"}	2026-05-17 13:12:15.239515+03	2026-05-18 17:18:15.231775+03
01edffbb-42d7-4f10-b85b-349b6c5c43b5	322be20b-4873-413a-bbea-6b29a71b3ae1	Гуртожиток №7	46.45309831522281	30.755466696193604	\N	{"lat": "46.4526153", "lon": "30.7571929", "name": "Одеський національний університет ім. І. Мечнікова", "type": "university", "osm_id": 389211332, "address": {"city": "Одеса", "road": "проспект Шевченка", "state": "Одеська область", "suburb": "Малий Фонтан", "amenity": "Одеський національний університет ім. І. Мечнікова", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65058", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "amenity", "osm_type": "way", "place_id": 61624652, "importance": 0.5364632906608526, "place_rank": 30, "addresstype": "amenity", "boundingbox": ["46.4499712", "46.4553168", "30.7546508", "30.7593370"], "display_name": "Одеський національний університет ім. І. Мечнікова, проспект Шевченка, Малий Фонтан, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65058, Україна"}	2026-05-17 12:51:28.765435+03	2026-05-18 17:00:00.274067+03
911452e1-6d3a-4dce-864e-411a459b1970	322be20b-4873-413a-bbea-6b29a71b3ae1	Гуртожиток №9	46.45253801653794	30.75829780861775	\N	{"lat": "46.4525924", "lon": "30.7583258", "name": "", "type": "apartments", "osm_id": 591684141, "address": {"city": "Одеса", "road": "Французький бульвар", "state": "Одеська область", "suburb": "Малий Фонтан", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65015", "residential": "ЖБК \\"Науковий працівник\\"", "country_code": "ua", "house_number": "26/2", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 61522158, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4523263", "46.4528622", "30.7579113", "30.7585202"], "display_name": "26/2, Французький бульвар, ЖБК \\"Науковий працівник\\", Малий Фонтан, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65015, Україна"}	2026-05-17 12:53:13.008135+03	2026-05-17 13:34:17.681811+03
b97431a2-940c-4e9c-8091-7783628ba70e	d486d8af-3673-4686-b69e-9efda0dca7c2	Стадіон ОНУ ім. І. І. Мечникова	46.45086723451459	30.75860898406736	\N	{"lat": "46.4526153", "lon": "30.7571929", "name": "Одеський національний університет ім. І. Мечнікова", "type": "university", "osm_id": 389211332, "address": {"city": "Одеса", "road": "проспект Шевченка", "state": "Одеська область", "suburb": "Малий Фонтан", "amenity": "Одеський національний університет ім. І. Мечнікова", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65058", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "amenity", "osm_type": "way", "place_id": 61672702, "importance": 0.5364632906608526, "place_rank": 30, "addresstype": "amenity", "boundingbox": ["46.4499712", "46.4553168", "30.7546508", "30.7593370"], "display_name": "Одеський національний університет ім. І. Мечнікова, проспект Шевченка, Малий Фонтан, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65058, Україна"}	2026-05-17 13:15:32.900729+03	2026-05-18 17:08:15.524795+03
aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	3fc60154-803d-495b-9906-3543562722d2	Відділ ОНУ ім. І. І. Мечникова (вул. Всеволода Змієнка)	46.48762276579439	30.73136983377855	\N	{"lat": "46.4876099", "lon": "30.7311211", "name": "Палеонтологічний музей", "type": "museum", "osm_id": 2381109894, "address": {"city": "Одеса", "road": "вулиця Всеволода Змієнка", "state": "Одеська область", "suburb": "Центр", "borough": "Приморський район", "country": "Україна", "tourism": "Палеонтологічний музей", "district": "Одеський район", "postcode": "65082", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "tourism", "osm_type": "node", "place_id": 61618412, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "tourism", "boundingbox": ["46.4875599", "46.4876599", "30.7310711", "30.7311711"], "display_name": "Палеонтологічний музей, вулиця Всеволода Змієнка, Центр, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65082, Україна"}	2026-05-17 12:42:54.513125+03	2026-05-18 17:08:24.090952+03
ef08a6fb-bf32-4d7f-a8a7-a22aa8cb9618	322be20b-4873-413a-bbea-6b29a71b3ae1	Гуртожиток №2	46.48307016208911	30.72286515341156	\N	{"lat": "46.4830946", "lon": "30.7228905", "name": "", "type": "yes", "osm_id": 160465488, "address": {"city": "Одеса", "road": "провулок Топольського", "state": "Одеська область", "suburb": "Центр", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65020", "country_code": "ua", "house_number": "4", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 61726842, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4829549", "46.4832864", "30.7226809", "30.7230945"], "display_name": "4, провулок Топольського, Центр, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65020, Україна"}	2026-05-17 12:44:46.045816+03	2026-05-17 13:34:24.02274+03
faf7cb86-fb63-421b-b181-513f76582ad9	322be20b-4873-413a-bbea-6b29a71b3ae1	Гуртожиток № 1	46.49061193737319	30.728758959149562	\N	{"lat": "46.4905595", "lon": "30.7288161", "name": "", "type": "yes", "osm_id": 160458213, "address": {"city": "Одеса", "road": "Університетська вулиця", "state": "Одеська область", "suburb": "Центр", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65082", "country_code": "ua", "house_number": "1", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 61706083, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4903921", "46.4907736", "30.7285792", "30.7292667"], "display_name": "1, Університетська вулиця, Центр, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65082, Україна"}	2026-05-17 12:43:51.265302+03	2026-05-17 13:34:27.815709+03
6485acd3-c1a3-4fee-aba2-39332c7aa57c	322be20b-4873-413a-bbea-6b29a71b3ae1	Гуртожиток №4,5	46.45531972894744	30.756808356639272	\N	{"lat": "46.4553000", "lon": "30.7568030", "name": "", "type": "yes", "osm_id": 161037405, "address": {"city": "Одеса", "road": "вулиця Довженка", "state": "Одеська область", "suburb": "Відрада", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65058", "country_code": "ua", "house_number": "5", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 62061724, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4550740", "46.4555260", "30.7563050", "30.7573010"], "display_name": "5, вулиця Довженка, Відрада, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65058, Україна"}	2026-05-17 12:46:47.893682+03	2026-05-17 13:43:21.613877+03
cbad5486-2d7f-48ce-a94a-b40f83da03ed	3fc60154-803d-495b-9906-3543562722d2	Відділ ОНУ ім. І. І. Мечникова (вул. Французький бульвар)	46.455156537740905	30.759200481907524	\N	{"lat": "46.4550213", "lon": "30.7589993", "name": "Одеський національний університет імені І. І. Мечникова", "type": "university", "osm_id": 232448793, "address": {"city": "Одеса", "road": "Французький бульвар", "state": "Одеська область", "suburb": "Малий Фонтан", "amenity": "Одеський національний університет імені І. І. Мечникова", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65015", "residential": "ЖБК \\"Науковий працівник\\"", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "amenity", "osm_type": "way", "place_id": 62048421, "importance": 0.5364632906608526, "place_rank": 30, "addresstype": "amenity", "boundingbox": ["46.4540965", "46.4559524", "30.7577847", "30.7601679"], "display_name": "Одеський національний університет імені І. І. Мечникова, Французький бульвар, ЖБК \\"Науковий працівник\\", Малий Фонтан, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65015, Україна"}	2026-05-17 13:04:54.467693+03	2026-05-18 17:08:35.847822+03
41ecb609-bacc-42d1-9e2c-a91969b25e83	3fc60154-803d-495b-9906-3543562722d2	Відділ ОНУ ім. І. І. Мечникова (вул. Університетська)	46.48892620020461	30.730242149333847	\N	{"lat": "46.4881115", "lon": "30.7307561", "name": "Універсітет ім. Мечникова", "type": "university", "osm_id": 386424479, "address": {"city": "Одеса", "road": "вулиця Пастера", "state": "Одеська область", "suburb": "Центр", "amenity": "Універсітет ім. Мечникова", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65082", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "amenity", "osm_type": "way", "place_id": 62598201, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "amenity", "boundingbox": ["46.4871172", "46.4891055", "30.7295126", "30.7317585"], "display_name": "Універсітет ім. Мечникова, вулиця Пастера, Центр, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65082, Україна"}	2026-05-18 16:27:21.02503+03	2026-05-18 21:40:09.387051+03
7fba1b86-0255-4d53-aa35-01975f1917e1	322be20b-4873-413a-bbea-6b29a71b3ae1	Гуртожиток №6,8	46.45401715097858	30.755144049279117	\N	{"lat": "46.4540622", "lon": "30.7550956", "name": "Гуртожиток ОНУ ім. Мечнікова", "type": "dormitory", "osm_id": 153677086, "address": {"city": "Одеса", "road": "вулиця Довженка", "state": "Одеська область", "suburb": "Відрада", "borough": "Приморський район", "country": "Україна", "building": "Гуртожиток ОНУ ім. Мечнікова", "district": "Одеський район", "postcode": "65058", "country_code": "ua", "house_number": "9а", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 61690171, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4537506", "46.4543737", "30.7548206", "30.7553706"], "display_name": "Гуртожиток ОНУ ім. Мечнікова, 9а, вулиця Довженка, Відрада, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65058, Україна"}	2026-05-17 12:50:10.758835+03	2026-05-18 16:58:12.775976+03
f12fe93b-5a3e-47ad-9540-af1bf809129a	bf077bf7-5909-4ca4-8686-6ed28d8b0547	Наукова бібліотека ОНУ ім. І. І. Мечникова	46.48611406794946	30.73322815021447	\N	{"lat": "46.4859900", "lon": "30.7331841", "name": "Наукова бібліотека ОНУ", "type": "library", "osm_id": 160137940, "address": {"city": "Одеса", "road": "Преображенська вулиця", "state": "Одеська область", "suburb": "Центр", "amenity": "Наукова бібліотека ОНУ", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65082", "country_code": "ua", "house_number": "24", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "amenity", "osm_type": "way", "place_id": 61863642, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "amenity", "boundingbox": ["46.4856616", "46.4862995", "30.7329868", "30.7333872"], "display_name": "Наукова бібліотека ОНУ, 24, Преображенська вулиця, Центр, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65082, Україна"}	2026-05-17 12:59:09.111608+03	2026-05-18 17:07:55.229622+03
0e4dddc6-e75b-4333-9b64-b793b37799f4	3843e5b8-d92c-48e5-94da-732a473a92bd	Фаховий коледж ОНУ ім. І. І. Мечникова	46.450772957862526	30.745144155849665	\N	{"lat": "46.4507143", "lon": "30.7452092", "name": "", "type": "yes", "osm_id": 154881286, "address": {"city": "Одеса", "road": "вулиця Добровольців", "state": "Одеська область", "suburb": "Сахалінчик", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65070", "residential": "Житловий комплекс \\"Зоряне містечко\\"", "country_code": "ua", "house_number": "4", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 62147571, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4505288", "46.4508998", "30.7448124", "30.7456060"], "display_name": "4, вулиця Добровольців, Житловий комплекс \\"Зоряне містечко\\", Сахалінчик, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65070, Україна"}	2026-05-18 17:05:42.904646+03	2026-05-18 21:40:07.857276+03
a2e02b93-89e7-4a24-ab77-367d8cd9019c	3fc60154-803d-495b-9906-3543562722d2	Відділ ОНУ ім. І. І. Мечникова (Шампанський пров.)	46.451473368104786	30.75669925143389	\N	{"lat": "46.4526153", "lon": "30.7571929", "name": "Одеський національний університет ім. І. Мечнікова", "type": "university", "osm_id": 389211332, "address": {"city": "Одеса", "road": "проспект Шевченка", "state": "Одеська область", "suburb": "Малий Фонтан", "amenity": "Одеський національний університет ім. І. Мечнікова", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65058", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "amenity", "osm_type": "way", "place_id": 61672702, "importance": 0.5364632906608526, "place_rank": 30, "addresstype": "amenity", "boundingbox": ["46.4499712", "46.4553168", "30.7546508", "30.7593370"], "display_name": "Одеський національний університет ім. І. Мечнікова, проспект Шевченка, Малий Фонтан, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65058, Україна"}	2026-05-18 16:45:23.23732+03	2026-05-18 21:40:10.651921+03
e030ba04-e1f6-4366-ac70-e6b11d4270ca	8d35fc5e-047f-4ca0-8e79-895caf6f7fb2	Ботанічний сад ОНУ ім. І. І. Мечникова	46.44203691934704	30.768188834390163	\N	{"lat": "46.4431373", "lon": "30.7679894", "name": "", "type": "apartments", "osm_id": 161038300, "address": {"city": "Одеса", "road": "Французький бульвар", "state": "Одеська область", "suburb": "Малий Фонтан", "borough": "Приморський район", "country": "Україна", "district": "Одеський район", "postcode": "65058", "country_code": "ua", "house_number": "85/5", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "building", "osm_type": "way", "place_id": 62129108, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "building", "boundingbox": ["46.4429670", "46.4433120", "30.7671163", "30.7688329"], "display_name": "85/5, Французький бульвар, Малий Фонтан, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65058, Україна"}	2026-05-18 15:44:19.959175+03	2026-05-18 21:40:11.893907+03
e7353ad0-614f-47f4-885a-4913402ac6a2	3fc60154-803d-495b-9906-3543562722d2	Відділ ОНУ ім. І.І. Мечникова (вул. Пастера)	46.48852849454077	30.72819925956531	\N	{"lat": "46.4887303", "lon": "30.7284433", "name": "Торгова", "type": "bus_stop", "osm_id": 5066815706, "address": {"city": "Одеса", "road": "вулиця Пастера", "state": "Одеська область", "suburb": "Центр", "borough": "Приморський район", "country": "Україна", "highway": "Торгова", "district": "Одеський район", "postcode": "65082", "country_code": "ua", "municipality": "Одеська міська громада", "ISO3166-2-lvl4": "UA-51"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "highway", "osm_type": "node", "place_id": 61745765, "importance": 0.0000756244754710768, "place_rank": 30, "addresstype": "highway", "boundingbox": ["46.4886803", "46.4887803", "30.7283933", "30.7284933"], "display_name": "Торгова, вулиця Пастера, Центр, Приморський район, Одеса, Одеська міська громада, Одеський район, Одеська область, 65082, Україна"}	2026-05-18 21:31:57.223013+03	2026-05-18 21:40:13.189996+03
cb38b4d4-6083-4215-8f7d-5e8b391645eb	3fc60154-803d-495b-9906-3543562722d2	test	37.330609324284	-122.03054103225685	\N	{"lat": "37.3305944", "lon": "-122.0306041", "name": "Infinite Loop", "type": "residential", "osm_id": 789640002, "address": {"city": "Cupertino", "road": "Infinite Loop", "state": "Каліфорнія", "county": "Santa Clara County", "country": "Сполучені Штати Америки", "postcode": "95014", "commercial": "Apple Campus", "country_code": "us", "ISO3166-2-lvl4": "US-CA"}, "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "category": "highway", "osm_type": "way", "place_id": 322771173, "importance": 0.05339264591439685, "place_rank": 26, "addresstype": "road", "boundingbox": ["37.3305131", "37.3316924", "-122.0307831", "-122.0305849"], "display_name": "Infinite Loop, Apple Campus, Cupertino, Santa Clara County, Каліфорнія, 95014, Сполучені Штати Америки"}	2026-05-26 01:28:49.337+03	2026-05-25 22:31:21.580615+03
\.


--
-- Data for Name: location_photo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location_photo (id, location_id, image_url, storage_key, alt_uk, created_at, updated_at) FROM stdin;
4dca4381-bec6-40c6-86c3-e182634fc574	aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	http://localhost:5286/api/pictures/locations/aacde66a-8bbb-4cc9-8afa-df56a4d54b6e/1512411051_33.jpg	locations/aacde66a-8bbb-4cc9-8afa-df56a4d54b6e/1512411051_33.jpg	\N	2026-05-18 15:30:17.30321+03	2026-05-18 15:30:17.30321+03
b8d42069-5d9a-4f33-9318-ed9137705901	aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	http://localhost:5286/api/pictures/locations/aacde66a-8bbb-4cc9-8afa-df56a4d54b6e/%D0%BE%D0%BD%D1%83.jpg	locations/aacde66a-8bbb-4cc9-8afa-df56a4d54b6e/ону.jpg	\N	2026-05-18 15:30:19.53539+03	2026-05-18 15:30:19.53539+03
c224063b-95cb-4519-9992-fca2e6678cb4	aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	http://localhost:5286/api/pictures/locations/aacde66a-8bbb-4cc9-8afa-df56a4d54b6e/maxresdefault.jpg	locations/aacde66a-8bbb-4cc9-8afa-df56a4d54b6e/maxresdefault.jpg	\N	2026-05-18 15:30:22.24985+03	2026-05-18 15:30:22.24985+03
fe9b4457-870d-4de9-9e86-4294acdc2773	cbad5486-2d7f-48ce-a94a-b40f83da03ed	http://localhost:5286/api/pictures/locations/cbad5486-2d7f-48ce-a94a-b40f83da03ed/franz.webp	locations/cbad5486-2d7f-48ce-a94a-b40f83da03ed/franz.webp	\N	2026-05-18 15:40:13.221856+03	2026-05-18 15:40:13.221856+03
1f0a29ec-6edc-42c2-ae90-cb0107252ec2	cbad5486-2d7f-48ce-a94a-b40f83da03ed	http://localhost:5286/api/pictures/locations/cbad5486-2d7f-48ce-a94a-b40f83da03ed/94_main-v1577237963.jpg	locations/cbad5486-2d7f-48ce-a94a-b40f83da03ed/94_main-v1577237963.jpg	\N	2026-05-18 15:40:15.040647+03	2026-05-18 15:40:15.040647+03
041b661a-43cf-4c11-acfc-330899b118a7	cbad5486-2d7f-48ce-a94a-b40f83da03ed	http://localhost:5286/api/pictures/locations/cbad5486-2d7f-48ce-a94a-b40f83da03ed/4_main-v1630576356.jpg	locations/cbad5486-2d7f-48ce-a94a-b40f83da03ed/4_main-v1630576356.jpg	\N	2026-05-18 15:40:18.253022+03	2026-05-18 15:40:18.253022+03
fab45564-acbc-4cc5-9800-f28c2f6286e1	e030ba04-e1f6-4366-ac70-e6b11d4270ca	http://localhost:5286/api/pictures/locations/e030ba04-e1f6-4366-ac70-e6b11d4270ca/DSC_5140_1_3.jpg	locations/e030ba04-e1f6-4366-ac70-e6b11d4270ca/DSC_5140_1_3.jpg	\N	2026-05-18 15:45:34.486738+03	2026-05-18 15:45:34.486738+03
496080c0-ff6e-4a94-81c4-3a56344ab659	e030ba04-e1f6-4366-ac70-e6b11d4270ca	http://localhost:5286/api/pictures/locations/e030ba04-e1f6-4366-ac70-e6b11d4270ca/unnamed.jpg	locations/e030ba04-e1f6-4366-ac70-e6b11d4270ca/unnamed.jpg	\N	2026-05-18 16:14:41.624754+03	2026-05-18 16:14:41.624754+03
3add0b35-f657-464b-9b29-38570392a122	f12fe93b-5a3e-47ad-9540-af1bf809129a	http://localhost:5286/api/pictures/locations/f12fe93b-5a3e-47ad-9540-af1bf809129a/fd2f72f0661bc415311c3ffde10ef680-original.webp	locations/f12fe93b-5a3e-47ad-9540-af1bf809129a/fd2f72f0661bc415311c3ffde10ef680-original.webp	\N	2026-05-18 16:14:49.591752+03	2026-05-18 16:14:49.591752+03
f3bc4449-9660-4f61-90e8-8b1afde31584	f12fe93b-5a3e-47ad-9540-af1bf809129a	http://localhost:5286/api/pictures/locations/f12fe93b-5a3e-47ad-9540-af1bf809129a/images.jpeg	locations/f12fe93b-5a3e-47ad-9540-af1bf809129a/images.jpeg	\N	2026-05-18 16:14:51.631151+03	2026-05-18 16:14:51.631151+03
2e9a4a53-7009-476f-a6ee-3c5b90426662	f12fe93b-5a3e-47ad-9540-af1bf809129a	http://localhost:5286/api/pictures/locations/f12fe93b-5a3e-47ad-9540-af1bf809129a/images1.jpeg	locations/f12fe93b-5a3e-47ad-9540-af1bf809129a/images1.jpeg	\N	2026-05-18 16:14:54.415403+03	2026-05-18 16:14:54.415403+03
5961929d-bbe6-4a02-8705-4e9cbee8800d	719a7425-268f-445a-af98-e881f3a91aa3	http://localhost:5286/api/pictures/locations/719a7425-268f-445a-af98-e881f3a91aa3/IMG_4784-e1589835235202.jpg	locations/719a7425-268f-445a-af98-e881f3a91aa3/IMG_4784-e1589835235202.jpg	\N	2026-05-18 16:15:23.682535+03	2026-05-18 16:15:23.682535+03
b4c6a128-e131-448f-b6cd-a044d833f2d1	b97431a2-940c-4e9c-8091-7783628ba70e	http://localhost:5286/api/pictures/locations/b97431a2-940c-4e9c-8091-7783628ba70e/2c4bd27eae9998c4262719841f8c8070.jpg	locations/b97431a2-940c-4e9c-8091-7783628ba70e/2c4bd27eae9998c4262719841f8c8070.jpg	\N	2026-05-18 16:34:19.072151+03	2026-05-18 16:34:19.072151+03
a5b4d2f5-b8fb-47ab-b42f-c5d10c5df675	41ecb609-bacc-42d1-9e2c-a91969b25e83	http://localhost:5286/api/pictures/locations/41ecb609-bacc-42d1-9e2c-a91969b25e83/527928_800x600_10.jpg	locations/41ecb609-bacc-42d1-9e2c-a91969b25e83/527928_800x600_10.jpg	\N	2026-05-18 16:38:10.864441+03	2026-05-18 16:38:10.864441+03
87b7aba0-a4f6-48c9-8e41-84f660580eed	41ecb609-bacc-42d1-9e2c-a91969b25e83	http://localhost:5286/api/pictures/locations/41ecb609-bacc-42d1-9e2c-a91969b25e83/unnamed%20%282%29.jpg	locations/41ecb609-bacc-42d1-9e2c-a91969b25e83/unnamed (2).jpg	\N	2026-05-18 16:38:14.749284+03	2026-05-18 16:38:14.749284+03
6b4bd928-1390-498f-a9aa-d70546c7f6f2	ef08a6fb-bf32-4d7f-a8a7-a22aa8cb9618	http://localhost:5286/api/pictures/locations/ef08a6fb-bf32-4d7f-a8a7-a22aa8cb9618/unnamed%20%283%29.jpg	locations/ef08a6fb-bf32-4d7f-a8a7-a22aa8cb9618/unnamed (3).jpg	\N	2026-05-18 16:40:56.520727+03	2026-05-18 16:40:56.520727+03
54a3b4fc-7a1f-4848-a0a1-1e322b998b85	faf7cb86-fb63-421b-b181-513f76582ad9	http://localhost:5286/api/pictures/locations/faf7cb86-fb63-421b-b181-513f76582ad9/thumbnail.jpeg	locations/faf7cb86-fb63-421b-b181-513f76582ad9/thumbnail.jpeg	\N	2026-05-18 16:41:25.350258+03	2026-05-18 16:41:25.350258+03
4412dbbf-e31c-45cb-bd4c-09d50fe48dc6	b97431a2-940c-4e9c-8091-7783628ba70e	http://localhost:5286/api/pictures/locations/b97431a2-940c-4e9c-8091-7783628ba70e/thumbnail%20%281%29.jpeg	locations/b97431a2-940c-4e9c-8091-7783628ba70e/thumbnail (1).jpeg	\N	2026-05-18 16:43:26.809872+03	2026-05-18 16:43:26.809872+03
62fa4340-81cf-4c88-9990-a19cb4616dc7	a2e02b93-89e7-4a24-ab77-367d8cd9019c	http://localhost:5286/api/pictures/locations/a2e02b93-89e7-4a24-ab77-367d8cd9019c/unnamed%20%284%29.jpg	locations/a2e02b93-89e7-4a24-ab77-367d8cd9019c/unnamed (4).jpg	\N	2026-05-18 16:46:34.592948+03	2026-05-18 16:46:34.592948+03
95eb6258-5ed9-486b-a43b-ebcdc4033c05	0e4dddc6-e75b-4333-9b64-b793b37799f4	http://localhost:5286/api/pictures/locations/0e4dddc6-e75b-4333-9b64-b793b37799f4/unnamed%20%285%29.jpg	locations/0e4dddc6-e75b-4333-9b64-b793b37799f4/unnamed (5).jpg	\N	2026-05-18 17:06:45.691825+03	2026-05-18 17:06:45.691825+03
0d056c66-2442-44bf-936d-1f594a825ed3	e7353ad0-614f-47f4-885a-4913402ac6a2	http://localhost:5286/api/pictures/locations/e7353ad0-614f-47f4-885a-4913402ac6a2/unnamed%20%286%29.jpg	locations/e7353ad0-614f-47f4-885a-4913402ac6a2/unnamed (6).jpg	\N	2026-05-18 21:33:18.684658+03	2026-05-18 21:33:18.684658+03
\.


--
-- Data for Name: location_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location_type (id, code, title_uk, marker_key, created_at, updated_at) FROM stdin;
d486d8af-3673-4686-b69e-9efda0dca7c2	stadium	Стадіон	stadium_marker	2026-05-15 14:06:12.67484+03	2026-05-15 14:06:12.67484+03
322be20b-4873-413a-bbea-6b29a71b3ae1	dormitory	Гуртожиток	dormitory_marker	2026-05-15 14:06:12.67484+03	2026-05-15 14:06:12.67484+03
bf077bf7-5909-4ca4-8686-6ed28d8b0547	library	Бібліотека	library_marker	2026-05-14 22:22:11.813+03	2026-05-14 22:22:13.059+03
3fc60154-803d-495b-9906-3543562722d2	building	Корпус	building_marker	2026-05-15 14:09:55.742836+03	2026-05-15 14:09:55.742836+03
978d5f47-2589-4741-8f5f-1d1add666cc3	other	Інше	other_marker	2026-05-15 14:09:55.742836+03	2026-05-15 14:09:55.742836+03
8d35fc5e-047f-4ca0-8e79-895caf6f7fb2	garden	Ботанічний сад	garden_marker	2026-05-18 15:46:36.741415+03	2026-05-18 15:46:36.741415+03
3843e5b8-d92c-48e5-94da-732a473a92bd	сollege	Фаховий коледж	college_marker	2026-05-18 17:15:08.221411+03	2026-05-18 17:15:08.221411+03
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news (id, title, content, is_active, created_at, updated_at) FROM stdin;
85fa7511-e8f7-492f-b09d-fcda56b34ffd	Відкриття нового кампусного читального залу	В університеті відкрили сучасний читальний зал із цифровими ресурсами.	t	2026-05-15 13:36:13.965341+03	2026-05-15 13:36:13.965341+03
8f33c22c-c2da-4e6a-8c90-d54fc96f130e	Реконструкція спортивного комплексу	Ремонтні роботи у спортивному комплексі завершаться до кінця літа.	t	2026-05-15 13:36:13.965341+03	2026-05-15 13:36:13.965341+03
1232c612-48ca-43ae-b5dd-d83f3f94b938	Гостьова лекція з штучного інтелекту	Відомий професор наступного тижня прочитає лекцію про штучний інтелект.	t	2026-05-15 13:36:13.965341+03	2026-05-15 13:36:13.965341+03
ccdb2e66-1c76-4428-86d4-33b5239bbf4e	Закриття старого гуртожитку	Старий гуртожиток буде закрито через проблеми з безпекою.	f	2026-05-15 13:36:13.965341+03	2026-05-15 13:36:13.965341+03
b0eb6f5c-5a8c-49b3-81c5-7d9be3908ce1	Технічне обслуговування сайту	Сайт університету буде недоступний у вихідні через технічне обслуговування.	f	2026-05-15 13:36:13.965341+03	2026-05-15 13:36:13.965341+03
a5aa126d-ba55-4698-96dd-6792c5b61bfd	Скасування культурного фестивалю	Щорічний культурний фестиваль скасовано через непередбачувані обставини.	f	2026-05-15 13:36:13.965341+03	2026-05-15 13:36:13.965341+03
087cde9c-eca6-42e5-ac06-07b767fb9566	Запуск нової лабораторії робототехніки	В університеті відкрили лабораторію для досліджень у сфері робототехніки.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
62e67327-8155-4ff7-b0a2-b45e4e218240	Старт літньої школи програмування	Розпочалася літня школа з сучасних мов програмування для студентів.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
46870672-2d43-451b-aa1d-c7968ea11eb2	Відкриття коворкінгу для студентів	Новий коворкінг простір доступний для навчання та групових проєктів.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
09c759f2-4daa-4e5c-8756-b37f65fda6f9	Конференція з кібербезпеки	Університет організовує міжнародну конференцію з питань кібербезпеки.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
b1fd7ae8-c408-4954-8b75-6e84d2e383b6	Встановлення сонячних панелей	На даху головного корпусу встановлено сонячні панелі для енергозбереження.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
54551f47-5f04-47a3-bede-9e425acb89d6	Запуск мобільного додатку університету	Представлено мобільний додаток для студентів з розкладом та новинами.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
c964ab38-efa8-4b83-bda7-212b9a33ccb4	Нова програма подвійних дипломів	Студенти можуть отримати подвійний диплом у співпраці з європейськими університетами.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
437f49f9-622e-4c9e-babf-8ca05e8b0f3c	Відкриття виставки студентських робіт	У галереї університету відкрилася виставка творчих робіт студентів.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
54fd6332-5447-4ece-8565-73b851869cf5	Запуск курсу з машинного навчання	Додано новий курс з машинного навчання та аналізу даних.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
75260c8d-e637-43cd-9c4a-51bb9ec877a5	Оновлення спортивного інвентарю	Закуплено нове обладнання для спортивних секцій університету.	t	2026-05-15 13:49:34.532251+03	2026-05-15 13:49:34.532251+03
\.


--
-- Data for Name: university_object; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.university_object (id, location_id, object_type_id, title, description, created_at, updated_at) FROM stdin;
e305ac0b-5672-40bf-82ed-a94ea2bb59bb	faf7cb86-fb63-421b-b181-513f76582ad9	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №1	Завідувачка: Рудоман Ірина Миколаївна\nтел.: (048) 731-74-63	2026-05-17 12:54:48.435645+03	2026-05-17 12:54:48.435645+03
0ce10e2e-7b29-44e6-b539-bb75d43a9e60	ef08a6fb-bf32-4d7f-a8a7-a22aa8cb9618	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №2	Завідувачка: Рогульська Наталя Ярославівна\nтел.: (048) 726-28-67	2026-05-17 12:55:06.958289+03	2026-05-17 12:55:06.958289+03
e9406a8b-000d-4c09-833c-2c640e770f31	6485acd3-c1a3-4fee-aba2-39332c7aa57c	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №4	Завідувачка: Михайлова Інна Валеріївна\nтел.: (0482) 68-75-86	2026-05-17 12:55:33.217747+03	2026-05-17 12:55:33.217747+03
00886973-8f8c-4f08-9a01-7482464fad9d	7fba1b86-0255-4d53-aa35-01975f1917e1	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №6	Завідувачка: Копусь Ілона Олександрівна\nтел.: (0482) 68-12-43	2026-05-17 12:56:09.389967+03	2026-05-17 12:56:09.389967+03
b19008a0-99a9-4778-849d-fae22577832d	01edffbb-42d7-4f10-b85b-349b6c5c43b5	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №7	Завідувачка: Белімова Наталія Борисівна\nтел.: (0482) 63-32-15	2026-05-17 12:56:27.695772+03	2026-05-17 12:56:27.695772+03
d285742d-ec02-499a-a43b-9283e730fcf0	911452e1-6d3a-4dce-864e-411a459b1970	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №9	Завідувач: Шевчук Сергій Гаврилович\nтел.: (0482) 68-07-58	2026-05-17 12:57:20.166409+03	2026-05-17 12:57:20.166409+03
16fcabe8-e681-47bd-b18b-297a1d1d22d9	aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет математики, фізики та інформаційних технологій	\N	2026-05-17 13:02:16.203515+03	2026-05-17 13:02:16.203515+03
dae4acf5-795b-4410-8fa9-07f2e6a654e6	aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	73554eef-325d-4d37-b7de-8d7aba789326	Укриття	\N	2026-05-17 13:02:50.924062+03	2026-05-17 13:02:50.924062+03
2a63978c-bebe-4ffc-a409-26337d1149eb	cbad5486-2d7f-48ce-a94a-b40f83da03ed	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Філологічний факультет	\N	2026-05-17 13:07:27.024955+03	2026-05-17 13:07:27.024955+03
03901789-bd67-4a48-b10e-2497878187ec	cbad5486-2d7f-48ce-a94a-b40f83da03ed	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет романо-германської філології	\N	2026-05-17 13:08:37.118163+03	2026-05-17 13:08:37.118163+03
aa29f4cd-23d1-4a8a-8d03-639b532adc55	cbad5486-2d7f-48ce-a94a-b40f83da03ed	73554eef-325d-4d37-b7de-8d7aba789326	Укриття	\N	2026-05-17 13:23:03.510173+03	2026-05-17 13:23:03.510173+03
d10fb319-f786-41f9-bad9-c31715b7e262	6485acd3-c1a3-4fee-aba2-39332c7aa57c	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №5	Завідувачка: Волкова Вікторія Анатоліївна\nтел.: (0482) 63-08-53	2026-05-17 12:55:49.655865+03	2026-05-17 13:42:35.048805+03
8c41b1cd-9659-4e27-9ff2-604d07e3bf75	41ecb609-bacc-42d1-9e2c-a91969b25e83	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Біологічний факультет	\N	2026-05-18 16:28:45.959352+03	2026-05-18 16:28:45.959352+03
34485978-5844-4af4-9a68-da9fb9a2e09f	41ecb609-bacc-42d1-9e2c-a91969b25e83	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Геолого-географічний факультет	\N	2026-05-18 16:29:05.011732+03	2026-05-18 16:29:05.011732+03
1c4f2794-4bd8-4d24-8e6e-c22de9d5b628	7fba1b86-0255-4d53-aa35-01975f1917e1	f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	Гуртожиток №8	\N	2026-05-18 16:58:32.813428+03	2026-05-18 16:58:32.813428+03
8ecac2d5-cee1-4782-a064-020d2d7c3a11	e030ba04-e1f6-4366-ac70-e6b11d4270ca	0b7c8f2d-6f1c-4064-90c0-87d22df9ea58	Ботанічний сад ОНУ ім. І. І. Мечникова	\N	2026-05-18 15:44:48.443167+03	2026-05-18 17:09:31.823803+03
5fc87489-7134-439e-9828-b62cca2e9c7f	f12fe93b-5a3e-47ad-9540-af1bf809129a	5c19698b-481f-4d78-b0ac-0fddedf51cea	Наукова бібліотека ОНУ ім. І. І. Мечникова	\N	2026-05-17 14:22:39.758347+03	2026-05-18 17:09:36.645715+03
ce06c6e9-f192-49c3-bba3-fc52d8d8c9d3	cbad5486-2d7f-48ce-a94a-b40f83da03ed	126cb396-9bd8-49df-9639-df4f31ad6c74	Приймальна комісія ОНУ ім. І. І. Мечникова	\N	2026-05-17 13:07:02.236829+03	2026-05-18 17:09:42.128998+03
14b20a28-f301-4847-ab1e-40441648a714	0e4dddc6-e75b-4333-9b64-b793b37799f4	a31cdf7f-0ae3-4199-9b9d-aa994ee3d8ee	Фаховий коледж ОНУ ім. І. І. Мечникова	\N	2026-05-18 16:52:08.473115+03	2026-05-18 17:09:49.494498+03
59180eb2-f213-42a8-a581-7d4389db3b9a	719a7425-268f-445a-af98-e881f3a91aa3	a31cdf7f-0ae3-4199-9b9d-aa994ee3d8ee	Одеський фаховий коледж комп'ютерних технологій ОНУ ім. І. І. Мечникова	\N	2026-05-17 13:14:29.899238+03	2026-05-18 17:10:07.309589+03
6e6765b1-b36b-482e-ae5c-250deb37eba2	cbad5486-2d7f-48ce-a94a-b40f83da03ed	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет міжнародних відносин, політології та соціології	\N	2026-05-18 16:50:54.400006+03	2026-05-18 17:10:27.592319+03
af52f188-1490-4d2f-b197-a79e75296e13	41ecb609-bacc-42d1-9e2c-a91969b25e83	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет гідрометеорології і екології	\N	2026-05-18 16:48:11.096253+03	2026-05-18 17:10:33.064818+03
00ab023b-67cb-4d15-b571-931842ba83e2	aacde66a-8bbb-4cc9-8afa-df56a4d54b6e	1d127c13-208b-49f9-bcd9-11b077c8e166	Деканат	\N	2026-05-17 13:00:25.967731+03	2026-05-18 17:10:43.015403+03
41247a46-9a8b-4230-b18c-c060faf9a8d6	cbad5486-2d7f-48ce-a94a-b40f83da03ed	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет журналістики	\N	2026-05-18 16:49:53.022181+03	2026-05-18 17:10:59.627286+03
6c723ba8-92bd-487f-9807-4bbbfa833ed1	a2e02b93-89e7-4a24-ab77-367d8cd9019c	113856e4-282e-4697-b891-f7bd65a983ea	Кафедра Медичних Знань та БЖД	\N	2026-05-18 16:46:01.243643+03	2026-05-18 17:11:04.592018+03
c67a5c81-d864-46b8-80eb-c1941e12438a	cbad5486-2d7f-48ce-a94a-b40f83da03ed	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет психології та соціології	\N	2026-05-18 16:51:28.6931+03	2026-05-18 17:11:10.292117+03
cc6b303c-ee5f-4957-8d0d-bb6a880fabb0	cbad5486-2d7f-48ce-a94a-b40f83da03ed	0393525a-c9a0-40d5-81b5-f30b355d2ee9	Факультет історії та філософії	\N	2026-05-18 16:50:26.836015+03	2026-05-18 17:11:16.591974+03
7890a42d-cdbe-4d46-9ce8-0db3d6b239e2	b97431a2-940c-4e9c-8091-7783628ba70e	c41d9844-26e6-4eab-9d5a-0584d40f37de	Стадіон ОНУ ім. І. І. Мечникова	\N	2026-05-17 13:16:01.040801+03	2026-05-18 17:11:37.860758+03
7d28b830-b195-4309-8711-4b2c9b45aa7c	f12fe93b-5a3e-47ad-9540-af1bf809129a	31a161ac-7f60-479b-aec2-7489f3a8d93e	Архів ОНУ ім. І. І. Мечникова	\N	2026-05-18 12:26:27.706015+03	2026-05-18 17:11:50.624822+03
e7d2a566-0a00-40cf-bb6a-b3714f634af6	e7353ad0-614f-47f4-885a-4913402ac6a2	113856e4-282e-4697-b891-f7bd65a983ea	Кафедра фізики та астрономії ОНУ імені І.І. Мечникова	\N	2026-05-18 21:32:28.733046+03	2026-05-18 21:32:28.733046+03
\.


--
-- Data for Name: university_object_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.university_object_type (id, code, title_uk, created_at, updated_at) FROM stdin;
5c19698b-481f-4d78-b0ac-0fddedf51cea	library_unit	Бібліотечний відділ	2026-05-14 22:23:29.283+03	2026-05-14 22:23:30.44+03
0393525a-c9a0-40d5-81b5-f30b355d2ee9	faculty_unit	Факультет	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
113856e4-282e-4697-b891-f7bd65a983ea	department_unit	Кафедра	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
126cb396-9bd8-49df-9639-df4f31ad6c74	admissionoffice_unit	Приймальна комісія	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
1d127c13-208b-49f9-bcd9-11b077c8e166	deanery_unit	Деканат	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
c41d9844-26e6-4eab-9d5a-0584d40f37de	stadium_unit	Стадіон	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
c340c3ed-7d76-4bd6-8f0f-e1c161bd59bf	museum_unit	Музей	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
7b43ad6a-8143-40c6-9563-49e14b1a8e3c	laboratory_unit	Лабораторія	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
964371e8-1e38-42f5-a5f2-e512d5c1428d	administration_unit	Адміністрація	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
73554eef-325d-4d37-b7de-8d7aba789326	shelter_unit	Укриття	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
57a94434-9e49-4abf-b698-83d863dfb84a	other_unit	Інше	2026-05-15 14:13:56.150828+03	2026-05-15 14:13:56.150828+03
f36d854e-41c6-4f7e-a081-57cdbc2e8c5c	dormitory_unit	Гуртожиток	2026-05-17 00:25:08.680409+03	2026-05-17 00:25:08.680409+03
a31cdf7f-0ae3-4199-9b9d-aa994ee3d8ee	college_unit	Фаховий коледж	2026-05-17 13:10:39.040892+03	2026-05-17 13:10:39.040892+03
31a161ac-7f60-479b-aec2-7489f3a8d93e	archive_unit	Архів	2026-05-18 12:25:49.638278+03	2026-05-18 12:25:49.638278+03
0b7c8f2d-6f1c-4064-90c0-87d22df9ea58	garden_unit	Ботанічний сад	2026-05-18 15:43:19.670997+03	2026-05-18 15:43:19.670997+03
\.


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: admins PK_admins; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT "PK_admins" PRIMARY KEY (id);


--
-- Name: location PK_location; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT "PK_location" PRIMARY KEY (id);


--
-- Name: location_photo PK_location_photo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_photo
    ADD CONSTRAINT "PK_location_photo" PRIMARY KEY (id);


--
-- Name: location_type PK_location_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_type
    ADD CONSTRAINT "PK_location_type" PRIMARY KEY (id);


--
-- Name: news PK_news; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "PK_news" PRIMARY KEY (id);


--
-- Name: university_object PK_university_object; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.university_object
    ADD CONSTRAINT "PK_university_object" PRIMARY KEY (id);


--
-- Name: university_object_type PK_university_object_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.university_object_type
    ADD CONSTRAINT "PK_university_object_type" PRIMARY KEY (id);


--
-- Name: IX_admins_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_admins_created_at" ON public.admins USING btree (created_at);


--
-- Name: IX_admins_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_admins_email" ON public.admins USING btree (email);


--
-- Name: IX_admins_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_admins_username" ON public.admins USING btree (username);


--
-- Name: IX_location_location_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_location_location_type_id" ON public.location USING btree (location_type_id);


--
-- Name: IX_location_photo_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_location_photo_location_id" ON public.location_photo USING btree (location_id);


--
-- Name: IX_location_photo_storage_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_location_photo_storage_key" ON public.location_photo USING btree (storage_key);


--
-- Name: IX_location_type_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_location_type_code" ON public.location_type USING btree (code);


--
-- Name: IX_news_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_news_created_at" ON public.news USING btree (created_at);


--
-- Name: IX_news_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_news_is_active" ON public.news USING btree (is_active);


--
-- Name: IX_university_object_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_university_object_location_id" ON public.university_object USING btree (location_id);


--
-- Name: IX_university_object_object_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_university_object_object_type_id" ON public.university_object USING btree (object_type_id);


--
-- Name: IX_university_object_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_university_object_title" ON public.university_object USING btree (title);


--
-- Name: IX_university_object_type_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IX_university_object_type_code" ON public.university_object_type USING btree (code);


--
-- Name: location FK_location_location_type_location_type_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT "FK_location_location_type_location_type_id" FOREIGN KEY (location_type_id) REFERENCES public.location_type(id) ON DELETE RESTRICT;


--
-- Name: location_photo FK_location_photo_location_location_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_photo
    ADD CONSTRAINT "FK_location_photo_location_location_id" FOREIGN KEY (location_id) REFERENCES public.location(id) ON DELETE CASCADE;


--
-- Name: university_object FK_university_object_location_location_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.university_object
    ADD CONSTRAINT "FK_university_object_location_location_id" FOREIGN KEY (location_id) REFERENCES public.location(id) ON DELETE CASCADE;


--
-- Name: university_object FK_university_object_university_object_type_object_type_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.university_object
    ADD CONSTRAINT "FK_university_object_university_object_type_object_type_id" FOREIGN KEY (object_type_id) REFERENCES public.university_object_type(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict AabjCxXU0BsfFRDsVm0h2QDXTzjbTSHfZO9aN5Dtin2mkcSwwJtaHLUnuobx9JU

