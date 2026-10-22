<script>
  let { label = "Email address", type = "email" } = $props();
</script>

<label class="form-control w-full">
  <span class="label text-gray-900">{label}</span>
  <input {type} class="input input-bordered w-full outline-0" />
</label>
