export type User = {
  id: number;
  username: string;
  email?: string;
  image_file: string | null;
  image_path: string;
};

export type Post = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  date_posted: string;
  author: User;
};

export type PaginatedPosts = {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
};
