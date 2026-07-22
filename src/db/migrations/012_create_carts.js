exports.up = function (knex) {
  return knex.schema.createTable('carts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('session_id', 255).nullable();
    table.integer('promo_code_id').unsigned().nullable()
      .references('id').inTable('promo_codes').onDelete('SET NULL');
    table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0);
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['session_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('carts');
};
