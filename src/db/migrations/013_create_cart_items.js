exports.up = function (knex) {
  return knex.schema.createTable('cart_items', (table) => {
    table.increments('id').primary();
    table.integer('cart_id').unsigned().notNullable()
      .references('id').inTable('carts').onDelete('CASCADE');
    table.integer('sku_id').unsigned().notNullable()
      .references('id').inTable('skus').onDelete('CASCADE');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['cart_id', 'sku_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cart_items');
};
