import type { GeneratedClientAdapter } from "../generated.js";
import type { fastapi___compat__v2__Body_icon__upload } from "../openapi_client/models/fastapi___compat__v2__Body_icon__upload.js";
import { IconsService } from "../openapi_client/services/IconsService.js";

export class IconsNamespace {
  constructor(private readonly client: GeneratedClientAdapter) {}

  upload(file: Blob) {
    const payload: fastapi___compat__v2__Body_icon__upload = {
      file: file as unknown as string,
    };
    return this.client.request(() => IconsService.iconUpload(payload));
  }

  getPublic(iconPath: string) {
    return this.client.request(() => IconsService.iconPublicGet(iconPath));
  }
}
