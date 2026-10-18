# FastAPI Blog Frontend

The frontend interface and state layer for the blog platform, communicating across an immutable HTTP network seam with an external FastAPI backend.

## Language

**User**:
A registered member who can publish posts and manage their own identity.
_Avoid_: Account, client, profile

**Avatar**:
The displayable visual portrait representing a User, normalized to a fully-qualified web path with a default placeholder fallback.
_Avoid_: Profile picture, image_path, image_file

**Post**:
A published blog entry authored by a User with a title, body content, and publication date.
_Avoid_: Article, publication, story

**Backend Adapter**:
The deep module encapsulating network communication, credential lifecycle, response normalization, and error translation for the external FastAPI service.
_Avoid_: API client, service layer, fetch helper

**Backend Error**:
A normalized failure originating from the external backend contract, carrying an HTTP status code, user-readable explanation, and optional field-level validation issues.
_Avoid_: API error, fetch error, Axios error
