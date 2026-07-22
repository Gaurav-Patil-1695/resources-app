exports.up = function (knex) {
  return knex.schema.createTable('payment_attempts', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');
    table.string('payment_gateway', 50).notNullable();
    table.string('gateway_order_id', 255).nullable();
    table.string('gateway_payment_id', 255).nullable();
    table.string('gateway_signature', 500).nullable();
    table.enu('status', ['initiated', 'pending', 'success', 'failed', 'cancelled'])
      .notNullable().defaultTo('initiated');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table.json('gateway_response').nullable();
    table.text('failure_reason').nullable();
    table.timestamp('attempted_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
    table.index(['gateway_payment_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_attempts');
};
