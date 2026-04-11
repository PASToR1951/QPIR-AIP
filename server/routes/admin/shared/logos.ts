export const SCHOOL_LOGO_DIR = "./public/school-logos";
export const CLUSTER_LOGO_DIR = "./public/cluster-logos";
export const APP_LOGO_DIR = "./public/app-logo";

export const LOGO_MIME_EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};

const LOGO_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "gif"];

export async function removeExistingLogoFiles(dir: string, entityId: number) {
  await Promise.all(
    LOGO_EXTENSIONS.map(async (extension) => {
      try {
        await Deno.remove(`${dir}/${entityId}.${extension}`);
      } catch {
        // Missing files are fine; this is cleanup before replacing or removing a logo.
      }
    }),
  );
}

export async function removeExistingSchoolLogos(schoolId: number) {
  await removeExistingLogoFiles(SCHOOL_LOGO_DIR, schoolId);
}

export async function removeExistingClusterLogos(clusterId: number) {
  await removeExistingLogoFiles(CLUSTER_LOGO_DIR, clusterId);
}

export async function removeExistingAppLogos() {
  try {
    for await (const entry of Deno.readDir(APP_LOGO_DIR)) {
      if (entry.isFile) await Deno.remove(`${APP_LOGO_DIR}/${entry.name}`);
    }
  } catch {
    // Directory may not exist yet — that's fine.
  }
}
