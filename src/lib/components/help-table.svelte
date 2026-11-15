<script lang="ts">
  import * as Table from "#lib/components/ui/table/index.js";

  let pences = [
    0.01, 0.1, 1, 10, 100, 123, 1000, 0.03, 0.12, 1.34, 11.65, 148.94, 1984.26,
  ];
  const sortedPences = $derived(pences.toSorted((a, b) => a - b));
</script>

<Table.Root>
  <Table.Caption class="sr-only">Help table</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Pence - <i>p</i></Table.Head>
      <Table.Head>Pounds - <i>£</i></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each sortedPences as pence (pence)}
      <Table.Row>
        <Table.Cell>{pence}p</Table.Cell>
        <Table.Cell>£{pence * 0.01}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
