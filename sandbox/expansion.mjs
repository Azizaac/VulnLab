import * as reset from './reset-token.mjs';
import * as csrf from './csrf-preferences.mjs';
import * as traversal from './traversal-receipts.mjs';
import * as upload from './upload-validation.mjs';
import * as graphql from './graphql-auth.mjs';
import * as cors from './cors-origin.mjs';
import * as webhook from './webhook-ssrf.mjs';
import * as oauth from './oauth-state.mjs';
import * as couponRace from './coupon-race.mjs';
import * as propertyAuth from './property-auth.mjs';
import * as minimization from './data-minimization.mjs';
import * as multiTenant from './multi-tenant.mjs';

export const expansion = {
    'password-reset-token-lifecycle': reset,
    'csrf-preferences': csrf,
    'path-traversal-receipts': traversal,
    'file-upload-validation': upload,
    'graphql-object-access': graphql,
    'cors-credential-boundary': cors,
    'webhook-ssrf-fixtures': webhook,
    'oauth-callback-state': oauth,
    'coupon-race': couponRace,
    'api-property-auth': propertyAuth,
    'api-data-minimization': minimization,
    'multi-tenant-workspace': multiTenant,
};
