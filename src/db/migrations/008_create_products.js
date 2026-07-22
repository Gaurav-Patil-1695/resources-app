exports.up = function (knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 300).notNullable().unique();
    table.text('description').nullable();
    table.text('short_description').nullable();
    table.integer('category_id').unsigned().nullable()
      .references('id').inTable('categories').onDelete('SET NULL');
    table.integer('brand_id').unsigned().nullable()
      .references('id').inTable('brands').onDelete('SET NULL');
    table.decimal('base_price', 10, 2).notNullable();
    table.decimal('selling_price', 10, 2).notNullable();
    table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0);
    table.string('tax_class', 50).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.string('meta_title', 255).nullable();
    table.text('meta_description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('products');
};
