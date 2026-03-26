import type { GeneratedClientAdapter } from "../generated.js";
import { IconsService } from "../openapi_client/services/IconsService.js";

export class IconsNamespace {
  constructor(private readonly client: GeneratedClientAdapter) {}

  upload(file: Blob) {
    return this.client.request(() => IconsService.iconUpload({ file }));
  }

  getPublic(iconPath: string) {
    return this.client.request(() => IconsService.iconPublicGet(iconPath));
  }
}
