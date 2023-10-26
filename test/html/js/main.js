
const tests = [];
const id = ulid();
tests.push(id);
tests.push(ulid.timestamp(id));
tests.push(ulid.data(id));
tests.push('--------------------------------');

const uuid = ulid.toUUID(id);
tests.push(uuid);
tests.push(ulid.timestamp(uuid));
tests.push(ulid.data(uuid));
tests.push('--------------------------------');

tests.push(ulid.fromUUID(uuid));
tests.push('--------------------------------');

const factory = ulid.factory();
tests.push(factory.ulid());
tests.push(factory.ulid());
tests.push(factory.uuid());
tests.push(factory.uuid());

document.getElementById('tests').value = tests.join('\n');