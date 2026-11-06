<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuCategory extends Model
{

use SoftDeletes;
    protected $table = 'menu_categories';

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function menuItems()
{
    return $this->hasMany(MenuItem::class, 'menu_category_id');
}
}
