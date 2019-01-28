import { EndpointModel } from '../store/types/endpoint.types';
import { IFavoriteMetadata, UserFavorite, UserFavoriteEndpoint } from '../store/types/user-favorites.types';
import { CfAPIResource } from './../store/types/api.types';

export function isEndpointTypeFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  return !favorite.entityId;
}


export function getFavoriteFromCfEntity<T extends IFavoriteMetadata>(entity, entityKey: string) {
  if (isCfEntity(entity as CfAPIResource)) {
    return new UserFavorite<T>(
      entity.entity.cfGuid,
      'cf',
      entityKey,
      entity.metadata.guid,
      entity
    );
  }
  return null;
}

export function getFavoriteFromEndpointEntity(endpoint: EndpointModel) {
  if (isEndpointEntity(endpoint)) {
    return new UserFavoriteEndpoint(
      endpoint.guid,
      endpoint.cnsi_type,
      endpoint
    );
  }
  return null;
}

function isEndpointEntity(endpoint: EndpointModel) {
  return endpoint && endpoint.guid && endpoint.cnsi_type;
}

function isCfEntity(entity: CfAPIResource) {
  return entity && entity.entity.cfGuid && entity.metadata && entity.metadata.guid;
}
