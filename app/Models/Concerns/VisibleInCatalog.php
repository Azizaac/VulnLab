<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Schema;

trait VisibleInCatalog
{
    protected static function bootVisibleInCatalog(): void
    {
        static::addGlobalScope('catalog', function ($query) {
            // Earlier migrations invoke domain services before V5 columns exist.
            if (Schema::hasColumn($query->getModel()->getTable(), 'catalog_visible')) {
                $query->where($query->getModel()->qualifyColumn('catalog_visible'), true);
            }
        });
    }
}
