/* eslint-disable @typescript-eslint/naming-convention */
import {
  _Object,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  ObjectVersion,
  S3Client
} from '@aws-sdk/client-s3';

import { Factory } from '../types';

export type S3Factory = Factory<S3Options, S3>;

export type S3Options = {
  readonly region: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
};

export type S3ObjectMetadata = {
  readonly key?: string;
  readonly size?: number;
  readonly lastModified?: Date;
};

export class S3 {
  static factory(this: void, options: S3Options): S3 {
    return new S3(options);
  }

  readonly #region: string;
  readonly #client: S3Client;

  constructor({ region, accessKeyId, secretAccessKey }: S3Options) {
    this.#client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    this.#region = region;
  }

  getRegion(): string {
    return this.#region;
  }

  async listAllObjects(
    bucket: string,
    objectsSoFar: readonly _Object[] = [],
    continuationToken?: string,
    requestsSoFar = 0
  ): Promise<readonly [readonly S3ObjectMetadata[], number]> {
    const { Contents, NextContinuationToken: nextContinuationToken } =
      await this.#client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken
        })
      );

    const objects = [...objectsSoFar, ...(Contents ?? [])];
    return nextContinuationToken === undefined
      ? [objects.map(convertS3Object), requestsSoFar + 1]
      : this.listAllObjects(
          bucket,
          objects,
          nextContinuationToken,
          requestsSoFar + 1
        );
  }

  async listAllObjectVersions(
    bucket: string,
    versionsSoFar: readonly ObjectVersion[] = [],
    keyMarker?: string,
    versionIdMarker?: string,
    requestsSoFar = 0
  ): Promise<readonly [readonly S3ObjectMetadata[], number]> {
    const {
      Versions: newVersions,
      NextKeyMarker: nextKeyMarker,
      NextVersionIdMarker: nextVersionIdMarker
    } = await this.#client.send(
      new ListObjectVersionsCommand({
        Bucket: bucket,
        KeyMarker: keyMarker,
        VersionIdMarker: versionIdMarker
      })
    );

    const versions = [...versionsSoFar, ...(newVersions ?? [])];
    return nextKeyMarker === undefined && nextVersionIdMarker === undefined
      ? [versions.map(convertS3ObjectVersion), requestsSoFar + 1]
      : this.listAllObjectVersions(
          bucket,
          versions,
          nextKeyMarker,
          nextVersionIdMarker,
          requestsSoFar + 1
        );
  }
}

function convertS3Object(object: _Object): S3ObjectMetadata {
  return {
    key: object.Key,
    size: object.Size,
    lastModified: object.LastModified
  };
}

function convertS3ObjectVersion(version: ObjectVersion): S3ObjectMetadata {
  return {
    key: version.Key,
    size: version.Size,
    lastModified: version.LastModified
  };
}
