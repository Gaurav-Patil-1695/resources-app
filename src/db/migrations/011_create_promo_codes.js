exports.up = function (knex) {
  return knex.schema.createTable('promo_codes', (table) => {
    table.increments('id').primary();
    table.string('code', 50).notNullable().unique();
    table.text('description').nullable();
    table.enu('discount_type', ['percentage', 'flat']).notNullable();
    table.decimal('discount_value', 10, 2).notNullable();
    table.decimal('max_discount_amount', 10, 2).nullable();
    table.decimal('min_order_value', 10, 2).nullable();
    table.integer('usage_limit').unsigned().nullable();
    table.integer('usage_count').unsigned().notNullable().defaultTo(0);
    table.integer('per_user_limit').unsigned().nullable();
    table.json('rules').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('starts_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('promo_codes');
};
