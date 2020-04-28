import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchAllDomains, FetchDomain } from '../actions/domains.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface DomainActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid,
    endpointGuid
  ) => FetchDomain;
  getMultiple: (
    endpointGuid,
    paginationKey,
    { flatten }: CFBasePipelineRequestActionMeta
  ) => FetchAllDomains;
};

export const domainActionBuilders: DomainActionBuilders = {
  get: (
    guid,
    endpointGuid
  ) => new FetchDomain(guid, endpointGuid),
  // FIXME: Remove pagination key from get all requests. This might need some investigation regarding places where we use different keys
  // for lists of same type - #STRAT-149
  getMultiple: (
    endpointGuid,
    paginationKey,
    { flatten }: CFBasePipelineRequestActionMeta = {}
  ) => new FetchAllDomains(endpointGuid, paginationKey, flatten)
};


