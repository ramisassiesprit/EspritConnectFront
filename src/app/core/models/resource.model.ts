export interface ResourceFile {
  id: string;
  name: string;
  mimeType: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceFolder {
  id: string;
  name: string;
  coverImageUrl: string;
  creatorName: string;
  creatorAvatarUrl: string;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
}

export interface ResourceFolderDetails {
  id: string;
  name: string;
  coverImageUrl: string;
  creatorName: string;
  creatorAvatarUrl: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  files: ResourceFile[];
}

export interface CreateResourceFolderRequest {
  name: string;
  coverImageUrl?: string;
}
