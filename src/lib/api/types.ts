/**
 * Readable aliases for the API types generated from docs/openapi.json.
 * Never hand-write API shapes; regenerate with `npm run generate:api` when the
 * contract changes.
 */
import type { components, paths } from "./schema";

/** All schemas from the OpenAPI document, keyed by DTO name. */
export type ApiSchemas = components["schemas"];

/** All API paths with their operations, for typing the API client. */
export type ApiPaths = paths;

/** The API's standard error body (design.md 5.1). */
export type ApiErrorBody = ApiSchemas["ErrorResponseDto"];
export type User = ApiSchemas["UserResponseDto"];
export type Profile = ApiSchemas["ProfileResponseDto"];
export type UserSearchResult = ApiSchemas["UserSearchResultDto"];
export type UserSearchPage = ApiSchemas["UserSearchPageDto"];
export type Post = ApiSchemas["PostResponseDto"];
export type PostAuthor = ApiSchemas["PostAuthorDto"];
export type PostPage = ApiSchemas["PostPageDto"];
export type MediaType = ApiSchemas["MediaType"];
export type LikeState = ApiSchemas["LikeStateDto"];
export type SaveState = ApiSchemas["SaveStateDto"];
export type Comment = ApiSchemas["CommentResponseDto"];
export type CommentPage = ApiSchemas["CommentPageDto"];
export type Upload = ApiSchemas["UploadResponseDto"];
/** What an upload is for (POST /uploads `purpose`); decides the allowed types and sizes. */
export type UploadPurpose =
  ApiPaths["/api/v1/uploads"]["post"]["requestBody"]["content"]["multipart/form-data"]["purpose"];
export type Notification = ApiSchemas["NotificationResponseDto"];
export type NotificationPage = ApiSchemas["NotificationPageDto"];
export type NotificationType = ApiSchemas["NotificationType"];
export type UnreadCount = ApiSchemas["UnreadCountDto"];
export type UnreadConversationsCount = ApiSchemas["UnreadConversationsCountDto"];
export type Conversation = ApiSchemas["ConversationResponseDto"];
export type ConversationPage = ApiSchemas["ConversationPageDto"];
export type Message = ApiSchemas["MessageResponseDto"];
export type MessagePage = ApiSchemas["MessagePageDto"];
export type Health = ApiSchemas["HealthResponseDto"];
