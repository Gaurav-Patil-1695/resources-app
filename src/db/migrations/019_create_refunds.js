exports.up = function (knex) {
  return knex.schema.createTable('refunds', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('RESTRICT');
    table.integer('payment_attempt_id').unsigned().nullable()
      .references('id').inTable('payment_attempts').onDelete('SET NULL');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table.enu('status', ['pending', 'processing', 'success', 'failed'])
      .notNullable().defaultTo('pending');
    table.string('gateway_refund_id', 255).nullable();
    table.text('reason').nullable();
    table.json('gateway_response').nullable();
    table.text('failure_reason').nullable();
    table.timestamp('initiated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('refunds');
};
