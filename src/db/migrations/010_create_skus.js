exports.up = function (knex) {
  return knex.schema.createTable('skus', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable()
      .references('id').inTable('products').onDelete('CASCADE');
    table.string('sku_code', 100).notNullable().unique();
    table.string('size', 50).nullable();
    table.string('colour', 100).nullable();
    table.integer('stock_quantity').unsigned().notNullable().defaultTo(0);
    table.integer('reserved_quantity').unsigned().notNullable().defaultTo(0);
    table.integer('low_stock_threshold').unsigned().notNullable().defaultTo(5);
    table.decimal('price_override', 10, 2).nullable();
    table.string('barcode', 100).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('skus');
};
