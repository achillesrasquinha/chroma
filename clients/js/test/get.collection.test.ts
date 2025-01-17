import { expect, test } from "@jest/globals";
import chroma from "./initClient";
import { DOCUMENTS, EMBEDDINGS, IDS, METADATAS } from "./data";
import { ChromaValueError, InvalidCollectionError } from "../src/Errors";

test("it should get a collection", async () => {
  await chroma.reset();
  const collection = await chroma.createCollection({ name: "test" });
  await collection.add({
    ids: IDS,
    embeddings: EMBEDDINGS,
    metadatas: METADATAS,
  });
  const results = await collection.get({ ids: ["test1"] });
  expect(results).toBeDefined();
  expect(results).toBeInstanceOf(Object);
  expect(results.ids.length).toBe(1);
  expect(["test1"]).toEqual(expect.arrayContaining(results.ids));
  expect(["test2"]).not.toEqual(expect.arrayContaining(results.ids));
  expect(results.included).toEqual(
    expect.arrayContaining(["metadatas", "documents"]),
  );

  const results2 = await collection.get({ where: { test: "test1" } });
  expect(results2).toBeDefined();
  expect(results2).toBeInstanceOf(Object);
  expect(results2.ids.length).toBe(1);
  expect(["test1"]).toEqual(expect.arrayContaining(results2.ids));
});

test("wrong code returns an error", async () => {
  await chroma.reset();
  const collection = await chroma.createCollection({ name: "test" });
  await collection.add({
    ids: IDS,
    embeddings: EMBEDDINGS,
    metadatas: METADATAS,
  });
  try {
    await collection.get({
      where: {
        //@ts-ignore supposed to fail
        test: { $contains: "hello" },
      },
    });
  } catch (error: any) {
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(ChromaValueError);
    expect(error.message).toMatchInlineSnapshot(
      `"Expected where operator to be one of $gt, $gte, $lt, $lte, $ne, $eq, $in, $nin, got $contains"`
    );
  }
});

test("it should get embedding with matching documents", async () => {
  await chroma.reset();
  const collection = await chroma.createCollection({ name: "test" });
  await collection.add({
    ids: IDS,
    embeddings: EMBEDDINGS,
    metadatas: METADATAS,
    documents: DOCUMENTS,
  });
  const results2 = await collection.get({
    whereDocument: { $contains: "This is a test" },
  });
  expect(results2).toBeDefined();
  expect(results2).toBeInstanceOf(Object);
  expect(results2.ids.length).toBe(1);
  expect(["test1"]).toEqual(expect.arrayContaining(results2.ids));
});

test("it should get records not matching", async () => {
  await chroma.reset();
  const collection = await chroma.createCollection({ name: "test" });
  await collection.add({
    ids: IDS,
    embeddings: EMBEDDINGS,
    metadatas: METADATAS,
    documents: DOCUMENTS,
  });
  const results2 = await collection.get({
    whereDocument: { $not_contains: "This is another" },
  });
  expect(results2).toBeDefined();
  expect(results2).toBeInstanceOf(Object);
  expect(results2.ids.length).toBe(2);
  expect(["test1", "test3"]).toEqual(expect.arrayContaining(results2.ids));
});

test("test gt, lt, in a simple small way", async () => {
  await chroma.reset();
  const collection = await chroma.createCollection({ name: "test" });
  await collection.add({
    ids: IDS,
    embeddings: EMBEDDINGS,
    metadatas: METADATAS,
  });
  const items = await collection.get({ where: { float_value: { $gt: -1.4 } } });
  expect(items.ids.length).toBe(2);
  expect(["test2", "test3"]).toEqual(expect.arrayContaining(items.ids));
});

test("should error on non existing collection", async () => {
  await chroma.reset();
  const collection = await chroma.createCollection({ name: "test" });
  await chroma.deleteCollection({ name: "test" });
  expect(async () => {
    await collection.get({ ids: IDS });
  }).rejects.toThrow(InvalidCollectionError);
});

test("it should throw an error if the collection does not exist", async () => {
  await chroma.reset();

  await expect(
    async () => await chroma.getCollection({ name: "test" })
  ).rejects.toThrow(Error);
});
